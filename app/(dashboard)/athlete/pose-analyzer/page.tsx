import PoseDetector from "@/components/pose-analyzer/PoseDetector";

export default function PoseAnalyzerPage() {
  return (
    <main className="px-6 py-8 flex flex-col items-center gap-8 min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pose Detection <span className="text-gray-400 font-normal">Live</span>
        </h1>
        <p className="text-sm text-gray-500">
          AthletyQ real-time pose landmark detection powered by MediaPipe
        </p>
      </div>

      {/* Pose Detector */}
      <div className="w-full flex justify-center">
        <PoseDetector />
      </div>
    </main>
  );
}
