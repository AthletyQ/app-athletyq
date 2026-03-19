import PoseDetector from "@/components/pose-analyzer/PoseDetector";

export default function PoseAnalyzerPage() {
  return (
    <main className="relative -mx-4 md:-mx-8 -mt-4 md:-mt-8 -mb-4 md:-mb-8 px-6 py-12 flex flex-col items-center gap-12 bg-[#13111c] min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-[bgRotate_30s_linear_infinite]"
          style={{
            background:
              'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.1) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl animate-[fadeInDown_0.6s_ease] relative z-10">
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-tight mb-4 flex items-center justify-center gap-3 flex-wrap">
          <span
            className="bg-[length:200%_200%] bg-clip-text text-transparent animate-[gradientShift_5s_ease_infinite]"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
          >
            Pose Detection
          </span>
          <span className="text-[clamp(2rem,4vw,3rem)] font-light text-slate-400">
            Live
          </span>
        </h1>
        <p className="text-lg text-slate-400 font-normal tracking-wide">
          AthletyQ Real-time human pose landmark detection powered by MediaPipe
        </p>
      </div>

      {/* Pose Detector */}
      <div className="relative z-10 w-full flex justify-center">
        <PoseDetector />
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-auto pt-12 text-center text-slate-500 text-sm animate-[fadeIn_0.6s_ease_0.4s_both]">
        <p>
          Built with <span className="text-indigo-400 font-semibold">Next.js</span> and{' '}
          <span className="text-indigo-400 font-semibold">MediaPipe</span>
        </p>
      </div>
    </main>
  );
}
