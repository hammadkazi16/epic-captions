'use client';

import { useEffect, useState, useRef } from "react";
import SparklesIcon from "@/components/SparklesIcon";
import { transcriptionItemsToSrt } from "@/libs/awsTranscriptionHelpers";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { translateText } from "@/app/actions/translate";

import roboto from './../fonts/Roboto-Regular.ttf';
import robotoBold from './../fonts/Roboto-Bold.ttf';

export default function ResultVideo({ filename, transcriptionItems, isButtonsOnly, isVideoOnly }) {
  const videoUrl =
    "https://hammad-captions.s3.ap-south-1.amazonaws.com/" + filename;

  const [loaded, setLoaded] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#FFFFFF");
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [progress, setProgress] = useState(1);
  const [items, setItems] = useState(transcriptionItems);

  const [selectedLanguage, setSelectedLanguage] = useState("hi");
  const [isTranslating, setIsTranslating] = useState(false);
  const [fontSize, setFontSize] = useState(24);

  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  useEffect(() => {
    setItems(transcriptionItems);
  }, [transcriptionItems]);

  useEffect(() => {
    videoRef.current.src = videoUrl;
    load();
  }, []);

  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    const baseURL =
      "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd";

    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });
    }

    await ffmpeg.writeFile("/tmp/roboto.ttf", await fetchFile(roboto));
    await ffmpeg.writeFile(
      "/tmp/roboto-bold.ttf",
      await fetchFile(robotoBold)
    );

    setLoaded(true);
  };

  function toFFmpegColor(rgb) {
    const bgr =
      rgb.slice(5, 7) + rgb.slice(3, 5) + rgb.slice(1, 3);
    return "&H" + bgr + "&";
  }

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
   const srt = transcriptionItemsToSrt(items);


    await ffmpeg.writeFile(filename, await fetchFile(videoUrl));
    await ffmpeg.writeFile("subs.srt", srt);

    videoRef.current.src = videoUrl;

    await new Promise((resolve) => {
      videoRef.current.onloadedmetadata = resolve;
    });

    const duration = videoRef.current.duration;

    ffmpeg.on("log", ({ message }) => {
      const match = /time=([0-9:.]+)/.exec(message);
      if (match?.[1]) {
        const [h, m, s] = match[1].split(":");
        const done = h * 3600 + m * 60 + parseFloat(s);
        setProgress(done / duration);
      }
    });

    await ffmpeg.exec([
      "-i",
      filename,
      "-preset",
      "ultrafast",
      "-vf",
      `subtitles=subs.srt:fontsdir=/tmp:force_style='Fontname=Roboto Bold,FontSize=${fontSize},MarginV=70,BorderStyle=2,Outline=2,Shadow=0,PrimaryColour=${toFFmpegColor(
        primaryColor
      )},OutlineColour=${toFFmpegColor(outlineColor)}'`,
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    videoRef.current.src = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" })
    );

    setProgress(1);
  };

  const downloadVideo = () => {
    const video = videoRef.current;
    if (!video || !video.src) {
      alert("No video available to download. Please apply captions first.");
      return;
    }

    const link = document.createElement("a");
    link.href = video.src;
    link.download = filename || "video.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

 const translateTranscription = async () => {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = transcriptionItems
        .map(item => item.content)
        .join(" ") || "";
      const prompt2 = `Translate the following text to ${selectedLanguage}: ${prompt} `;
      const promt3='Translate the following transcription and return only the translated text, without any additional commentary or metadata:'
      const prompt4=promt3+prompt2+prompt;
      const result = await model.generateContent(prompt4);
      const translatedText = result.response.text();
      const translatedItems = transcriptionItems.map((item, index) => ({
        ...item,
        content: translatedText.split(" ")[index] || item.content
      }));
      setTranscriptionItems(translatedItems);
    } catch (error) {
      console.error("Error translating transcription via Google AI:", error);
    }
  };


  return (
    <>
      {isVideoOnly ? (
        // Video Only Section
        <div className="rounded-lg overflow-hidden relative bg-black/40 border border-slate-700">
          {progress && progress < 1 && (
            <div className="absolute inset-0 bg-black/80 flex items-center z-10">
              <div className="w-full text-center">
                <div className="mx-8 rounded-lg overflow-hidden bg-slate-900">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-8 flex items-center justify-center transition-all"
                    style={{ width: progress * 100 + "%" }}
                  >
                    <h3 className="text-white text-sm font-bold">
                      {Math.floor(progress * 100)}%
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
          <video ref={videoRef} controls className="w-full rounded-lg" />
        </div>
      ) : isButtonsOnly ? (
        // Buttons Only Section
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-4">
            {/* Main Buttons */}
            <div className="space-y-2">
              <button
                onClick={transcode}
                disabled={!loaded}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 py-3 px-4 rounded-lg inline-flex gap-2 items-center justify-center border border-green-400/30 font-semibold transition-all"
              >
                <SparklesIcon />
                <span>Apply Captions</span>
              </button>

              <button
                onClick={translateTranscription}
                disabled={isTranslating}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 py-3 px-4 rounded-lg font-semibold border border-amber-400/30 transition-all"
              >
                {isTranslating ? "Translating..." : "Translate Captions"}
              </button>

              <button id="download"
                onClick={downloadVideo}
                className="w-full   bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-3 px-4 rounded-lg font-semibold border border-blue-400/30 transition-all"
              >
                Download Video
              </button>
            </div>

            {/* Language Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 uppercase">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full border border-slate-500 rounded-lg p-3 text-slate-900 bg-slate-100 font-medium"
              >
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
                <option value="en">English</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>

            {/* Color Pickers */}
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border border-slate-600"
                  />
                  <span className="text-sm text-gray-400 flex-1">{primaryColor}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase">Outline Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={outlineColor}
                    onChange={(e) => setOutlineColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border border-slate-600"
                  />
                  <span className="text-sm text-gray-400 flex-1">{outlineColor}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-gray-300 uppercase">Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>            </div>
          </div>
        </div>
      ) : (
        // Default: Both Buttons and Video
        <div className="flex w-[600px] flex-row gap-6 items-start">
          {/* Controls Section */}
          <div className="w-80 space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-4">
              {/* Main Buttons */}
              <div className="space-y-2">
                <button
                  onClick={transcode}
                  disabled={!loaded}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 py-3 px-4 rounded-lg inline-flex gap-2 items-center justify-center border border-green-400/30 font-semibold transition-all"
                >
                  <SparklesIcon />
                  <span>Apply Captions</span>
                </button>

                <button
                  onClick={translateTranscription}
                  disabled={isTranslating}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 py-3 px-4 rounded-lg font-semibold border border-amber-400/30 transition-all"
                >
                  {isTranslating ? "Translating..." : "Translate Captions"}
                </button>

                <button
                  onClick={downloadVideo}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-3 px-4 rounded-lg font-semibold border border-blue-400/30 transition-all"
                >
                  Download Video
                </button>
              </div>

              {/* Language Select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border border-slate-500 rounded-lg p-3 text-slate-900 bg-slate-100 font-medium"
                >
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="gu">Gujarati</option>
                  <option value="en">English</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>

              {/* Color Pickers */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border border-slate-600"
                    />
                    <span className="text-sm text-gray-400 flex-1">{primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase">Outline Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={outlineColor}
                      onChange={(e) => setOutlineColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border border-slate-600"
                    />
                    <span className="text-sm text-gray-400 flex-1">{outlineColor}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase">Font Size: {fontSize}px</label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div className="flex-1 rounded-xl overflow-hidden relative pb-5">
            <h2 className="text-2xl mb-6 text-white">Result</h2>
            {progress && progress < 1 && (
              <div className="absolute inset-0 bg-black/80 flex items-center z-10">
                <div className="w-full text-center">
                  <div className="mx-8 rounded-lg overflow-hidden">
                    <div
                      className="bg-purple-600 h-8"
                      style={{ width: progress * 100 + "%" }}
                    >
                      <h3 className="text-white text-xl">
                        {Math.floor(progress * 100)}%
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <video ref={videoRef} controls className="w-[450px] " />
          </div>
        </div>
      )}
    </>
  );
}
