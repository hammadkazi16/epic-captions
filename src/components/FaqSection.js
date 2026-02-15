export default function FaqSection() {
  return (
    <section className="mt-24 max-w-4xl mx-auto px-2 pt-32">
      
      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-white/70">
          Everything you need to know about AutoSub
        </p>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        
        {/* Item */}
        <details className="group bg-white/5 rounded-xl p-6 cursor-pointer">
          <summary className="flex justify-between items-center text-lg font-medium">
            How does AutoSub work?
            <span className="transition-transform group-open:rotate-45 text-xl">+</span>
          </summary>
          <p className="mt-4 text-white/70 leading-relaxed">
            AutoSub automatically generates accurate, styled captions for
            your videos using AI and embeds them directly into the video for
            social platforms.
          </p>
        </details>

        <details className="group bg-white/5 rounded-xl p-6 cursor-pointer">
          <summary className="flex justify-between items-center text-lg font-medium">
            Which video formats are supported?
            <span className="transition-transform group-open:rotate-45 text-xl">+</span>
          </summary>
          <p className="mt-4 text-white/70 leading-relaxed">
            We support all common formats including MP4, MOV, and WebM. Videos
            work perfectly for Shorts, Reels, and TikTok.
          </p>
        </details>

        <details className="group bg-white/5 rounded-xl p-6 cursor-pointer">
          <summary className="flex justify-between items-center text-lg font-medium">
            Can I translate captions into other languages?
            <span className="transition-transform group-open:rotate-45 text-xl">+</span>
          </summary>
          <p className="mt-4 text-white/70 leading-relaxed">
            Yes. You can translate captions into multiple languages like Hindi,
            English, Marathi, Gujarati, and Hinglish with one click.
          </p>
        </details>

        <details className="group bg-white/5 rounded-xl p-6 cursor-pointer">
          <summary className="flex justify-between items-center text-lg font-medium">
            Do captions stay synced with the video?
            <span className="transition-transform group-open:rotate-45 text-xl">+</span>
          </summary>
          <p className="mt-4 text-white/70 leading-relaxed">
            Absolutely. Captions are generated per timestamp, ensuring perfect
            sync even after translation or styling changes.
          </p>
        </details>

        <details className="group bg-white/5 rounded-xl p-6 cursor-pointer">
          <summary className="flex justify-between items-center text-lg font-medium">
            Is AutoSub free to use?
            <span className="transition-transform group-open:rotate-45 text-xl">+</span>
          </summary>
          <p className="mt-4 text-white/70 leading-relaxed">
            You can try AutoSub for free. Paid plans unlock longer videos,
            higher quality exports, and premium caption styles.
          </p>
        </details>

      </div>
    </section>
  );
}
