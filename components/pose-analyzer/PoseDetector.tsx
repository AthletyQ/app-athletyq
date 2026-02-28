'use client';

import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

const VISIBILITY_THRESHOLD = 0.7;
const ANGLE_BUFFER_SIZE = 5;

interface ArmLandmarks {
  shoulder: { x: number; y: number; z: number; visibility?: number };
  elbow: { x: number; y: number; z: number; visibility?: number };
  wrist: { x: number; y: number; z: number; visibility?: number };
}

const isArmVisible = (arm: ArmLandmarks): boolean =>
  (arm.shoulder.visibility ?? 0) > VISIBILITY_THRESHOLD &&
  (arm.elbow.visibility ?? 0) > VISIBILITY_THRESHOLD &&
  (arm.wrist.visibility ?? 0) > VISIBILITY_THRESHOLD;

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isDetectorReady, setIsDetectorReady] = useState(false);

  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const fpsTimestampRef = useRef<number>(0);
  const fpsCounterRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rightAngleBufferRef = useRef<number[]>([]);
  const leftAngleBufferRef = useRef<number[]>([]);

  useEffect(() => {
    console.log('[PoseDetector] Component mounted, initializing...');

    // Initialize MediaPipe PoseLandmarker
    const initializePoseLandmarker = async () => {
      try {
        console.log('[PoseDetector] Loading MediaPipe Vision tasks...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        console.log('[PoseDetector] Vision tasks loaded successfully');

        console.log('[PoseDetector] Creating PoseLandmarker with options...');
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        poseLandmarkerRef.current = poseLandmarker;
        setIsDetectorReady(true);
        console.log('[PoseDetector] PoseLandmarker initialized successfully');
      } catch (err) {
        console.error('[PoseDetector] Error initializing PoseLandmarker:', err);
        setError('Failed to initialize pose detection');
      }
    };

    initializePoseLandmarker();

    return () => {
      console.log('[PoseDetector] Component unmounting, cleaning up...');
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      console.log('[Webcam] Requesting camera access...');
      console.log('[Webcam] Requested resolution: 1280x720');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('[Webcam] Camera access granted');
      console.log('[Webcam] Stream details:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length
      });

      if (videoRef.current) {
        console.log('[Webcam] Setting stream to video element...');
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Log video track settings
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          console.log('[Webcam] Video track settings:', {
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            facingMode: settings.facingMode
          });
        }

        // Explicitly play the video to ensure it starts
        try {
          await videoRef.current.play();
          console.log('[Webcam] Video play() called successfully');
        } catch (playErr) {
          console.error('[Webcam] Error calling video.play():', playErr);
        }

        setHasPermission(true);
        setError(null);
        console.log('[Webcam] Webcam started successfully');
      }
    } catch (err) {
      console.error('[Webcam] Error accessing webcam:', err);
      console.error('[Webcam] Error name:', (err as Error).name);
      console.error('[Webcam] Error message:', (err as Error).message);
      setError('Failed to access webcam. Please grant camera permissions.');
      setHasPermission(false);
    }
  };

  const stopWebcam = () => {
    console.log('[Webcam] Stopping webcam...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('[Webcam] Stopping track:', track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
    console.log('[Webcam] Webcam stopped');
  };

  const detectPose = async () => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
      console.warn('[Detection] Missing required references');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('[Detection] Failed to get canvas context');
      return;
    }

    if (video.readyState !== 4) {
      // Video not ready yet, keep waiting
      animationFrameRef.current = requestAnimationFrame(detectPose);
      return;
    }

    // Set canvas size to match video (only log when size changes)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      console.log('[Detection] Setting canvas size:', {
        width: video.videoWidth,
        height: video.videoHeight
      });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const currentTime = video.currentTime;

    if (currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = currentTime;

      const detectStart = performance.now();

      // Detect pose
      const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());

      const detectEnd = performance.now();
      const detectTime = detectEnd - detectStart;

      // Clear canvas and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw pose landmarks
      if (results.landmarks && results.landmarks.length > 0) {
        const drawingUtils = new DrawingUtils(ctx);

        for (const landmarks of results.landmarks) {
          // Draw connections
          drawingUtils.drawConnectors(
            landmarks,
            PoseLandmarker.POSE_CONNECTIONS,
            { color: '#00FF00', lineWidth: 2 }
          );

          // Draw landmarks
          drawingUtils.drawLandmarks(landmarks, {
            color: '#FF0000',
            fillColor: '#FF0000',
            radius: 3
          });
        }
      }

      function calculateAngle(
        S: { x: number; y: number },
        E: { x: number; y: number },
        W: { x: number; y: number }
      ): number {
        const ES = { x: S.x - E.x, y: S.y - E.y };
        const EW = { x: W.x - E.x, y: W.y - E.y };

        const dotProduct = ES.x * EW.x + ES.y * EW.y;

        const magES = Math.sqrt(ES.x * ES.x + ES.y * ES.y);
        const magEW = Math.sqrt(EW.x * EW.x + EW.y * EW.y);

        // Clamp to [-1, 1] to guard against floating-point drift before acos
        const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magES * magEW)));
        return Math.acos(cosAngle) * (180 / Math.PI);
      }

      function drawAngleLabel(
        ctx: CanvasRenderingContext2D,
        landmark: { x: number; y: number },
        angle: number,
        label: string
      ) {
        const px = landmark.x * canvas.width;
        const py = landmark.y * canvas.height;
        const text = `${label}: ${angle.toFixed(1)}°`;

        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(text, px + 10, py - 10);
        ctx.fillStyle = '#FFFF00';
        ctx.fillText(text, px + 10, py - 10);
      }

      // Calculate and display elbow angles for visible arms
      for (const landmarks of results.landmarks) {
        const rightArm: ArmLandmarks = {
          shoulder: landmarks[12],
          elbow: landmarks[14],
          wrist: landmarks[16],
        };

        //console.log("rightArm", rightArm);

        const leftArm: ArmLandmarks = {
          shoulder: landmarks[11],
          elbow: landmarks[13],
          wrist: landmarks[15],
        };

       // console.log("leftArm", leftArm);

        if (isArmVisible(rightArm)) {
          const rawAngle = calculateAngle(rightArm.shoulder, rightArm.elbow, rightArm.wrist);
          rightAngleBufferRef.current.push(rawAngle);
          if (rightAngleBufferRef.current.length > ANGLE_BUFFER_SIZE) rightAngleBufferRef.current.shift();
          const rightAngle = rightAngleBufferRef.current.reduce((a, b) => a + b, 0) / rightAngleBufferRef.current.length;
          console.log('[Angle] Right elbow:', rightAngle.toFixed(1), '°');
          drawAngleLabel(ctx, rightArm.elbow, rightAngle, 'R');
        }

        if (isArmVisible(leftArm)) {
          const rawAngle = calculateAngle(leftArm.shoulder, leftArm.elbow, leftArm.wrist);
          leftAngleBufferRef.current.push(rawAngle);
          if (leftAngleBufferRef.current.length > ANGLE_BUFFER_SIZE) leftAngleBufferRef.current.shift();
          const leftAngle = leftAngleBufferRef.current.reduce((a, b) => a + b, 0) / leftAngleBufferRef.current.length;
          console.log('[Angle] Left elbow:', leftAngle.toFixed(1), '°');
          drawAngleLabel(ctx, leftArm.elbow, leftAngle, 'L');
        }
      }

      // Calculate FPS
      fpsCounterRef.current++;
      const now = performance.now();
      if (now - fpsTimestampRef.current >= 1000) {
        const currentFps = fpsCounterRef.current;
        setFps(currentFps);
        console.log('[Performance] FPS:', currentFps, '| Avg detection time:', detectTime.toFixed(2), 'ms');
        fpsCounterRef.current = 0;
        fpsTimestampRef.current = now;
      }

      // Draw FPS counter
      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = '#00FF00';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`FPS: ${fps}`, 10, 30);
      ctx.fillText(`FPS: ${fps}`, 10, 30);
    }

    animationFrameRef.current = requestAnimationFrame(detectPose);
  };

  const handleStartDetection = async () => {
    console.log('[Detection] Start button clicked');

    if (!poseLandmarkerRef.current) {
      console.error('[Detection] Pose detector not initialized');
      setError('Pose detector not initialized');
      return;
    }

    console.log('[Detection] Starting webcam...');
    await startWebcam();
    setIsDetecting(true);

    // Wait for video to be ready before starting detection
    if (videoRef.current) {
      console.log('[Detection] Waiting for video metadata...');
      videoRef.current.onloadedmetadata = () => {
        console.log('[Detection] Video metadata loaded');
        console.log('[Detection] Video dimensions:', {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
          readyState: videoRef.current?.readyState
        });
        console.log('[Detection] Starting pose detection loop...');
        detectPose();
      };

      // Also add play event listener to ensure video is playing
      videoRef.current.onplay = () => {
        console.log('[Detection] Video playing');
      };

      // Add error handler
      videoRef.current.onerror = (e) => {
        console.error('[Detection] Video error:', e);
      };
    }
  };

  const handleStopDetection = () => {
    setIsDetecting(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    stopWebcam();

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setFps(0);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopWebcam();
    };
  }, []);

  return (
    <div className="w-full max-w-[1200px] flex flex-col gap-8 animate-[fadeInUp_0.6s_ease_0.2s_both] mx-auto">
      {/* Video / Canvas */}
      <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl aspect-video border-2 border-indigo-500/20 transition-colors duration-300 hover:border-indigo-500/50">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full block bg-black"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center flex-wrap">
        {!isDetecting ? (
          <button
            onClick={handleStartDetection}
            disabled={!isDetectorReady}
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden shadow-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 3l14 9-14 9V3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isDetectorReady ? 'Start Detection' : 'Loading Model...'}
          </button>
        ) : (
          <button
            onClick={handleStopDetection}
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden shadow-md bg-gradient-to-br from-red-500 to-red-600 text-white hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95"
          >
            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="6" y="6" width="12" height="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Stop Detection
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500 rounded-xl text-red-400 font-medium animate-[shake_0.5s_ease]">
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {isDetecting && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500 rounded-full text-emerald-400 font-medium text-sm self-center">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Live Detection Active</span>
        </div>
      )}
    </div>
  );
}
