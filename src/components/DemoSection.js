import SparklesIcon from "@/components/SparklesIcon";
import FaqSection from "./FaqSection";

export default function DemoSection() {
  return (
    <>
    <section className="mt-12 sm:mt-20">
      <div className="flex items-center justify-center gap-12 sm:gap-20">
        
        {/* Before Video */}
        <div className="hidden sm:block bg-gray-800/50 w-[320px] sm:w-[380px] rounded-2xl overflow-hidden shadow-lg">
          <video
            src="https://dawid-epic-captions.s3.us-east-1.amazonaws.com/without-captions.mp4"
            preload
            muted
            autoPlay
            loop
            className="w-full h-auto"
            />
        </div>

        {/* Center Icon */}
        <div className="hidden sm:flex items-center justify-center">
          <SparklesIcon className="w-12 h-12 text-purple-400" />
        </div>

        {/* After Video */}
        <div className="bg-gray-800/50 w-[320px] sm:w-[380px] rounded-2xl overflow-hidden shadow-lg">
          <video
            src="https://dawid-epic-captions.s3.us-east-1.amazonaws.com/with-captions.mp4"
            preload
            muted
            autoPlay
            loop
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
    <FaqSection  />
            </>
  );
}
