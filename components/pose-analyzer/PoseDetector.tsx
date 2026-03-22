'use client';

import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { usePoseFeedback } from '@/hooks/usePoseFeedback';
import type { RepFormErrors } from '@/hooks/usePoseFeedback';

const VISIBILITY_THRESHOLD = 0.7;
const ANGLE_BUFFER_SIZE = 5;

// Bicep curl rep detection thresholds (degrees)
const CURL_UP_THRESHOLD = 50;    // angle must drop below this to register "up"
const CURL_DOWN_THRESHOLD = 160; // angle must rise above this to register "down" (= 1 rep)

// Form quality thresholds
const FLEX_QUALITY_THRESHOLD = 40;    // minAngle during curl must be < this (deeper = better)
const EXTEND_QUALITY_THRESHOLD = 170; // maxAngle at bottom must be > this for full extension
const ELBOW_DRIFT_THRESHOLD = 0.12;   // shoulder.z - elbow.z > this = elbow drifted forward

// Landmark index sets per arm — used to suppress the non-active arm when user stands side-on
const LEFT_ARM_INDICES  = new Set([11, 13, 15, 17, 19, 21]);
const RIGHT_ARM_INDICES = new Set([12, 14, 16, 18, 20, 22]);
// Minimum visibility gap to confidently decide which side is active (0 = always filter)
const SIDE_VIS_GAP = 0.2;

interface ArmLandmarks {
  shoulder: { x: number; y: number; z: number; visibility?: number };
  elbow: { x: number; y: number; z: number; visibility?: number };
  wrist: { x: number; y: number; z: number; visibility?: number };
}


interface RepAccumulator {
  extensionAngle: number;     // max angle seen in the 'down' phase before this curl
  minAngle: number;           // min angle reached during the 'up' (curl) phase
  maxElbowDrift: number;      // max (shoulder.z − elbow.z) during the curl
}

const newRepAcc = (): RepAccumulator => ({
  extensionAngle: 0,
  minAngle: Infinity,
  maxElbowDrift: 0,
});

const isArmVisible = (arm: ArmLandmarks): boolean =>
  (arm.shoulder.visibility ?? 0) > VISIBILITY_THRESHOLD &&
  (arm.elbow.visibility ?? 0) > VISIBILITY_THRESHOLD &&
  (arm.wrist.visibility ?? 0) > VISIBILITY_THRESHOLD;

function FeedbackItem({ ok, title, description }: { ok: boolean; title: string; description: string }) {
  return (
    <div className={`flex gap-3 p-3 rounded-xl ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ok ? 'bg-green-500' : 'bg-red-400'}`}>
        {ok ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className="text-white text-xs font-bold leading-none">!</span>
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold ${ok ? 'text-green-700' : 'text-red-700'}`}>{title}</p>
        <p className={`text-xs mt-0.5 leading-snug ${ok ? 'text-green-600' : 'text-red-500'}`}>{description}</p>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [_hasPermission, setHasPermission] = useState(false);
  const [isDetectorReady, setIsDetectorReady] = useState(false);

  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const fpsTimestampRef = useRef<number>(0);
  const fpsCounterRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rightAngleBufferRef = useRef<number[]>([]);
  const leftAngleBufferRef = useRef<number[]>([]);
  const rightCurlStateRef = useRef<'down' | 'up'>('down');
  const leftCurlStateRef = useRef<'down' | 'up'>('down');
  const rightRepCountRef = useRef<number>(0);
  const leftRepCountRef = useRef<number>(0);
  const [rightReps, setRightReps] = useState(0);
  const [leftReps, setLeftReps] = useState(0);
  const rightRepAccRef = useRef<RepAccumulator>(newRepAcc());
  const leftRepAccRef = useRef<RepAccumulator>(newRepAcc());
  const rightMaxExtensionRef = useRef<number>(0);
  const leftMaxExtensionRef = useRef<number>(0);
  const { requestFeedback, aiFeedback, isFetchingFeedback, isSpeaking, clearFeedback } = usePoseFeedback();

  // UI display state
  const latestAngleRef = useRef<number>(0);
  const [displayAngle, setDisplayAngle] = useState<number>(0);
  const [lastRepFeedback, setLastRepFeedback] = useState<RepFormErrors | null>(null);
  const [lastRepTime, setLastRepTime] = useState<number | null>(null);
  const [formScore, setFormScore] = useState<number | null>(null);
  const sessionStartRef = useRef<number>(0);
  const [sessionDuration, setSessionDuration] = useState('0:00');
  const [estimatedCalories, setEstimatedCalories] = useState(0);

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

      // eslint-disable-next-line react-hooks/purity
      const detectStart = performance.now();

      // Detect pose
      // eslint-disable-next-line react-hooks/purity
      const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());

      // eslint-disable-next-line react-hooks/purity
      const detectEnd = performance.now();
      const detectTime = detectEnd - detectStart;

      // Clear canvas and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw pose landmarks — suppress the non-active arm when user stands side-on
      if (results.landmarks && results.landmarks.length > 0) {
        const drawingUtils = new DrawingUtils(ctx);

        for (const landmarks of results.landmarks) {
          // Per-landmark visibility (shoulder/elbow/wrist for each side)
          const lShoulder = landmarks[11]?.visibility ?? 0;
          const lElbow    = landmarks[13]?.visibility ?? 0;
          const lWrist    = landmarks[15]?.visibility ?? 0;
          const rShoulder = landmarks[12]?.visibility ?? 0;
          const rElbow    = landmarks[14]?.visibility ?? 0;
          const rWrist    = landmarks[16]?.visibility ?? 0;

          // Use min: all three joints must be visible for the arm to count as "visible"
          const leftArmVis  = Math.min(lShoulder, lElbow, lWrist);
          const rightArmVis = Math.min(rShoulder, rElbow, rWrist);
          const gap = leftArmVis - rightArmVis;

          // Debug log throttled to ~1/s (fpsCounterRef hasn't incremented for this frame yet)
          if (fpsCounterRef.current % 30 === 0) {
            console.log(
              '[ArmVis] L shoulder/elbow/wrist:',
              lShoulder.toFixed(3), lElbow.toFixed(3), lWrist.toFixed(3),
              '→ max:', leftArmVis.toFixed(3),
              '| R shoulder/elbow/wrist:',
              rShoulder.toFixed(3), rElbow.toFixed(3), rWrist.toFixed(3),
              '→ max:', rightArmVis.toFixed(3),
              '| gap (L-R):', gap.toFixed(3),
              '| threshold:', SIDE_VIS_GAP,
            );
          }

          let inactiveSet: Set<number> | null = null;
          if      (gap >  SIDE_VIS_GAP) { inactiveSet = RIGHT_ARM_INDICES; if (fpsCounterRef.current % 30 === 0) console.log('[ArmVis] → suppressing RIGHT arm skeleton'); }
          else if (gap < -SIDE_VIS_GAP) { inactiveSet = LEFT_ARM_INDICES;  if (fpsCounterRef.current % 30 === 0) console.log('[ArmVis] → suppressing LEFT arm skeleton');  }
          else                          {                                    if (fpsCounterRef.current % 30 === 0) console.log('[ArmVis] → gap too small, drawing both arms'); }

          // Connections — drop any connection where both endpoints are on the inactive arm
          const connections = inactiveSet
            ? PoseLandmarker.POSE_CONNECTIONS.filter(
                ({ start, end }) => !(inactiveSet!.has(start) && inactiveSet!.has(end))
              )
            : PoseLandmarker.POSE_CONNECTIONS;
          drawingUtils.drawConnectors(landmarks, connections, { color: '#00FF00', lineWidth: 2 });

          // Landmark dots — skip inactive arm's indices entirely
          const visibleLandmarks = inactiveSet
            ? landmarks.filter((_, i) => !inactiveSet!.has(i))
            : landmarks;
          drawingUtils.drawLandmarks(visibleLandmarks, {
            color: '#FF0000',
            fillColor: '#FF0000',
            radius: 3,
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

          const elbowDrift = rightArm.shoulder.z - rightArm.elbow.z;

          if (rightCurlStateRef.current === 'down') {
            // Track max extension while arm hangs
            rightMaxExtensionRef.current = Math.max(rightMaxExtensionRef.current, rightAngle);
            if (rightAngle < CURL_UP_THRESHOLD) {
              // Transition down → up: arm starting to curl, snapshot baseline
              rightCurlStateRef.current = 'up';
              rightRepAccRef.current = {
                ...newRepAcc(),
                extensionAngle: rightMaxExtensionRef.current,
                minAngle: rightAngle,
                maxElbowDrift: elbowDrift,
              };
              rightMaxExtensionRef.current = 0;
            }
          } else {
            // In 'up' phase: accumulate form metrics every frame
            const acc = rightRepAccRef.current;
            acc.minAngle      = Math.min(acc.minAngle, rightAngle);
            acc.maxElbowDrift = Math.max(acc.maxElbowDrift, elbowDrift);

            if (rightAngle > CURL_DOWN_THRESHOLD) {
              // Transition up → down: rep complete — evaluate form
              rightCurlStateRef.current = 'down';
              rightRepCountRef.current += 1;
              setRightReps(rightRepCountRef.current);
              const errors: RepFormErrors = {
                incompleteFlexion:   acc.minAngle > FLEX_QUALITY_THRESHOLD,
                incompleteExtension: acc.extensionAngle < EXTEND_QUALITY_THRESHOLD,
                elbowDrift:          acc.maxElbowDrift > ELBOW_DRIFT_THRESHOLD,
              };
              setLastRepFeedback(errors);
              setLastRepTime(Date.now());
              setFormScore(Math.round(((3 - Object.values(errors).filter(Boolean).length) / 3) * 100));
              console.log('[Form] Right rep', rightRepCountRef.current, errors);
              requestFeedback('right', rightRepCountRef.current, errors);
            }
          }

          latestAngleRef.current = Math.round(rightAngle);
          drawAngleLabel(ctx, rightArm.elbow, rightAngle, 'R');
        }

        if (isArmVisible(leftArm)) {
          const rawAngle = calculateAngle(leftArm.shoulder, leftArm.elbow, leftArm.wrist);
          leftAngleBufferRef.current.push(rawAngle);
          if (leftAngleBufferRef.current.length > ANGLE_BUFFER_SIZE) leftAngleBufferRef.current.shift();
          const leftAngle = leftAngleBufferRef.current.reduce((a, b) => a + b, 0) / leftAngleBufferRef.current.length;

          const elbowDrift = leftArm.shoulder.z - leftArm.elbow.z;

          if (leftCurlStateRef.current === 'down') {
            leftMaxExtensionRef.current = Math.max(leftMaxExtensionRef.current, leftAngle);
            if (leftAngle < CURL_UP_THRESHOLD) {
              leftCurlStateRef.current = 'up';
              leftRepAccRef.current = {
                ...newRepAcc(),
                extensionAngle: leftMaxExtensionRef.current,
                minAngle: leftAngle,
                maxElbowDrift: elbowDrift,
              };
              leftMaxExtensionRef.current = 0;
            }
          } else {
            const acc = leftRepAccRef.current;
            acc.minAngle      = Math.min(acc.minAngle, leftAngle);
            acc.maxElbowDrift = Math.max(acc.maxElbowDrift, elbowDrift);

            if (leftAngle > CURL_DOWN_THRESHOLD) {
              leftCurlStateRef.current = 'down';
              leftRepCountRef.current += 1;
              setLeftReps(leftRepCountRef.current);
              const errors: RepFormErrors = {
                incompleteFlexion:   acc.minAngle > FLEX_QUALITY_THRESHOLD,
                incompleteExtension: acc.extensionAngle < EXTEND_QUALITY_THRESHOLD,
                elbowDrift:          acc.maxElbowDrift > ELBOW_DRIFT_THRESHOLD,
              };
              setLastRepFeedback(errors);
              setLastRepTime(Date.now());
              setFormScore(Math.round(((3 - Object.values(errors).filter(Boolean).length) / 3) * 100));
              console.log('[Form] Left rep', leftRepCountRef.current, errors);
              requestFeedback('left', leftRepCountRef.current, errors);
            }
          }

          latestAngleRef.current = Math.round(leftAngle);
          drawAngleLabel(ctx, leftArm.elbow, leftAngle, 'L');
        }
      }

      // Calculate FPS + throttle display state updates to once per second
      fpsCounterRef.current++;
      // eslint-disable-next-line react-hooks/purity
      const now = performance.now();
      if (now - fpsTimestampRef.current >= 1000) {
        const currentFps = fpsCounterRef.current;
        setFps(currentFps);
        console.log('[Performance] FPS:', currentFps, '| Avg detection time:', detectTime.toFixed(2), 'ms');
        fpsCounterRef.current = 0;
        fpsTimestampRef.current = now;

        // Throttled UI display updates
        setDisplayAngle(latestAngleRef.current);
        setSessionDuration(formatDuration(Date.now() - sessionStartRef.current));
        setEstimatedCalories(Math.round((rightRepCountRef.current + leftRepCountRef.current) * 5));
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
    sessionStartRef.current = Date.now();
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
    rightAngleBufferRef.current = [];
    leftAngleBufferRef.current = [];
    rightCurlStateRef.current = 'down';
    leftCurlStateRef.current = 'down';
    rightRepCountRef.current = 0;
    leftRepCountRef.current = 0;
    rightRepAccRef.current = newRepAcc();
    leftRepAccRef.current = newRepAcc();
    rightMaxExtensionRef.current = 0;
    leftMaxExtensionRef.current = 0;
    setRightReps(0);
    setLeftReps(0);
    setLastRepFeedback(null);
    setLastRepTime(null);
    setFormScore(null);
    setDisplayAngle(0);
    setSessionDuration('0:00');
    setEstimatedCalories(0);
    clearFeedback();
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
    <div className="w-full flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest text-gray-900">POSE DETECTION</h1>
        {isDetecting && (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-bold text-green-600 tracking-widest">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
            LIVE DETECTION ACTIVE
          </span>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-5 items-start">

        {/* LEFT: video + controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Controls bar — above video so it's always visible */}
          <div className="flex items-center justify-between px-1">
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Adjust Calibration
            </button>

            {!isDetecting ? (
              <button
                onClick={handleStartDetection}
                disabled={!isDetectorReady}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isDetectorReady ? 'Start Training' : 'Loading Model…'}
              </button>
            ) : (
              <button
                onClick={handleStopDetection}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                Stop Detection
              </button>
            )}
          </div>

          {/* Video container — flex-1 fills available height, aspect-ratio preserved by canvas */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video w-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Angle badge — top-left overlay */}
            {isDetecting && displayAngle > 0 && (
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm">
                <span className="text-sm font-bold text-gray-900 tracking-widest">
                  ANGLE: {displayAngle}°
                </span>
              </div>
            )}

            {/* AI coaching text — bottom overlay */}
            {isDetecting && (isFetchingFeedback || aiFeedback) && (
              <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center">
                {isFetchingFeedback ? (
                  <span className="text-white/60 text-base animate-pulse">Analyzing your form…</span>
                ) : (
                  <span className={`text-white font-semibold text-lg text-center ${isSpeaking ? 'animate-pulse' : ''}`}>
                    {isSpeaking && <span className="mr-2">🔊</span>}{aiFeedback}
                  </span>
                )}
              </div>
            )}

            {/* Idle placeholder */}
            {!isDetecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950">
                <svg className="w-14 h-14 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p className="text-gray-500 text-sm">
                  {isDetectorReady ? 'Press Start Training to begin' : 'Loading model…'}
                </p>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* RIGHT: stats panel */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">

          {/* Rep counters */}
          <div className="flex gap-3">
            {[
              { label: 'RIGHT ARM', count: rightReps },
              { label: 'LEFT ARM',  count: leftReps  },
            ].map(({ label, count }) => (
              <div key={label} className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-400 tracking-widest">{label}</p>
                <p className="text-4xl font-bold text-gray-900 mt-1 tabular-nums">{count}</p>
                <div className="mt-3 h-0.5 bg-blue-600 rounded-full" />
              </div>
            ))}
          </div>

          {/* Last Rep Feedback */}
          {lastRepFeedback && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Last Rep Feedback</h3>
                {lastRepTime && (
                  <span className="text-xs font-semibold text-gray-400">
                    {Math.round((Date.now() - lastRepTime) / 1000)}S AGO
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <FeedbackItem
                  ok={!lastRepFeedback.incompleteFlexion}
                  title={lastRepFeedback.incompleteFlexion ? 'Incomplete curl' : 'Full curl'}
                  description={lastRepFeedback.incompleteFlexion
                    ? 'Curl the weight higher for full bicep contraction.'
                    : 'Peak contraction maintained.'}
                />
                <FeedbackItem
                  ok={!lastRepFeedback.incompleteExtension}
                  title={lastRepFeedback.incompleteExtension ? 'Incomplete extension' : 'Full extension'}
                  description={lastRepFeedback.incompleteExtension
                    ? 'Lower the weight fully to stretch the muscle.'
                    : 'Excellent range of motion at the bottom of the movement.'}
                />
                <FeedbackItem
                  ok={!lastRepFeedback.elbowDrift}
                  title={lastRepFeedback.elbowDrift ? 'Elbow drifted' : 'Elbow stable'}
                  description={lastRepFeedback.elbowDrift
                    ? 'Keep your elbow pinned to your side throughout.'
                    : 'Good elbow control throughout the rep.'}
                />
              </div>
            </div>
          )}

          {/* Form Score */}
          {formScore !== null && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 tracking-widest">FORM SCORE</span>
                <span className="text-xl font-bold text-blue-600">{formScore}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${formScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Session stats */}
          {isDetecting && (
            <div className="bg-blue-600 rounded-xl p-4">
              <div className="flex justify-between">
                {[
                  { label: 'DURATION',  value: sessionDuration },
                  { label: 'INTENSITY', value: 'Medium'        },
                  { label: 'CALORIES',  value: String(estimatedCalories) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-blue-200 text-xs font-bold tracking-widest">{label}</p>
                    <p className="text-white text-lg font-bold mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
