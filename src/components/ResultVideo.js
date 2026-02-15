'use client';

import { useEffect, useState, useRef } from "react";
import SparklesIcon from "@/components/SparklesIcon";
import { transcriptionItemsToSrt } from "@/libs/awsTranscriptionHelpers";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { translateText } from "@/app/actions/translate";

import notoSansDevanagari from './../fonts/DM_Serif_Display,Noto_Sans_Devanagari/Noto_Sans_Devanagari/static/NotoSansDevanagari-Regular.ttf';
import notoSansGujarati from './../fonts/Noto_Sans_Gujarati/NotoSansGujarati-VariableFont_wdth,wght.ttf';
import notoSansTamil from './../fonts/Noto_Sans_Tamil/static/NotoSansTamil-Regular.ttf';

export default function ResultVideo({ filename, transcriptionItems, isButtonsOnly, isVideoOnly, setAwsTranscriptionItems }) {
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

  // Sync items back to parent after translations
  useEffect(() => {
    if (setAwsTranscriptionItems) {
      setAwsTranscriptionItems(items);
    }
  }, [items, setAwsTranscriptionItems]);

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

    // Load all language fonts
    await ffmpeg.writeFile("/tmp/NotoSansDevanagari-Regular.ttf", await fetchFile(notoSansDevanagari));
    await ffmpeg.writeFile("/tmp/NotoSansGujarati.ttf", await fetchFile(notoSansGujarati));
    await ffmpeg.writeFile("/tmp/NotoSansTamil.ttf", await fetchFile(notoSansTamil));

    setLoaded(true);
  };

  function getFontPathAndName(language) {
    const fontMap = {
      hi: { path: notoSansDevanagari, name: 'Noto Sans Devanagari' },
      mr: { path: notoSansDevanagari, name: 'Noto Sans Devanagari' },
      hinglish: { path: notoSansDevanagari, name: 'Noto Sans Devanagari' },
      gu: { path: notoSansGujarati, name: 'Noto Sans Gujarati' },
      ta: { path: notoSansTamil, name: 'Noto Sans Tamil' },
      tamil: { path: notoSansTamil, name: 'Noto Sans Tamil' },
      en: { path: notoSansDevanagari, name: 'Noto Sans Devanagari' },
    };
    return fontMap[language] || fontMap['en'];
  }

  function toFFmpegColor(rgb) {
    const bgr =
      rgb.slice(5, 7) + rgb.slice(3, 5) + rgb.slice(1, 3);
    return "&H" + bgr + "&";
  }

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    const srt = transcriptionItemsToSrt(items);
    const { name: fontName } = getFontPathAndName(selectedLanguage);

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
      `subtitles=subs.srt:fontsdir=/tmp:force_style='Fontname=${fontName},FontSize=${fontSize},MarginV=70,BorderStyle=2,Outline=2,Shadow=1,Bold=1,PrimaryColour=${toFFmpegColor(
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
    setIsTranslating(true);

    if (!items || items.length === 0) return;

    const indices = [];
    const textLines = [];

    items.forEach((item, index) => {
      if (item && item.content) {
        indices.push(index);
        textLines.push(item.content);
      }
    });

    const fullText = textLines.join("\n");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content:
                "Translate each line separately and return EXACTLY the same number of lines separated by newline. No commentary."
            },
            {
              role: "user",
              content: `Translate to ${selectedLanguage}:\n\n${fullText}`
            }
          ]
        })
      }
    );

    const data = await response.json();

    const translatedText =
      data?.choices?.[0]?.message?.content?.trim() || "";

    const translatedLines = translatedText.split("\n");

    const updatedItems = [...items];

    indices.forEach((originalIndex, i) => {
      updatedItems[originalIndex] = {
        ...updatedItems[originalIndex],
        content:
          translatedLines[i] ||
          updatedItems[originalIndex].content
      };
    });

    setItems(updatedItems);

  } catch (error) {
    console.error("Translation error:", error);
  } finally {
    setIsTranslating(false);
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
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 py-3 px-4 rounded-lg font-semibold border border-amber-400/30 transition-all inline-flex gap-2 items-center justify-center"
              >
                {isTranslating && (
                  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isTranslating ? "Translating..." : "Translate Captions"}</span>
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
                <option value="tamil">Tamil</option>
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
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 py-3 px-4 rounded-lg font-semibold border border-amber-400/30 transition-all inline-flex gap-2 items-center justify-center"
                >
                  {isTranslating && (
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isTranslating ? "Translating..." : "Translate Captions"}</span>
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
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="gu">Gujarati</option>
                  <option value="hinglish">Hinglish</option>
                  <option value="tamil">Tamil</option>
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
