'use client';

import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

const VISIBILITY_THRESHOLD = 0.7;
const ANGLE_BUFFER_SIZE = 5;

// Bicep curl rep detection thresholds (degrees)
const CURL_UP_THRESHOLD = 50;    // angle must drop below this to register "up"
const CURL_DOWN_THRESHOLD = 160; // angle must rise above this to register "down" (= 1 rep)

// Form quality thresholds
const FLEX_QUALITY_THRESHOLD = 40;    // minAngle during curl must be < this (deeper = better)
const EXTEND_QUALITY_THRESHOLD = 170; // maxAngle at bottom must be > this for full extension
const ELBOW_DRIFT_THRESHOLD = 0.12;   // shoulder.z - elbow.z > this = elbow drifted forward
const TORSO_LEAN_THRESHOLD = 0.05;    // change in (shoulder.z - hipMid.z) > this = torso lean

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

interface RepFormErrors {
  incompleteFlexion: boolean;   // didn't curl high enough
  incompleteExtension: boolean; // didn't extend low enough
  elbowDrift: boolean;          // upper arm swung forward during curl
  torsoLean: boolean;           // torso leaned back to assist the lift
}

interface RepAccumulator {
  extensionAngle: number;     // max angle seen in the 'down' phase before this curl
  minAngle: number;           // min angle reached during the 'up' (curl) phase
  maxElbowDrift: number;      // max (shoulder.z − elbow.z) during the curl
  baselineTorsoZ: number;     // shoulder.z − hipMid.z at curl start
  maxTorsoLeanDelta: number;  // max deviation from baseline during curl
}

const newRepAcc = (): RepAccumulator => ({
  extensionAngle: 0,
  minAngle: Infinity,
  maxElbowDrift: 0,
  baselineTorsoZ: 0,
  maxTorsoLeanDelta: 0,
});

const isArmVisible = (arm: ArmLandmarks): boolean =>
  (arm.shoulder.visibility ?? 0) > VISIBILITY_THRESHOLD &&
  (arm.elbow.visibility ?? 0) > VISIBILITY_THRESHOLD &&
  (arm.wrist.visibility ?? 0) > VISIBILITY_THRESHOLD;

function FormCheck({ ok, good, bad }: { ok: boolean; good: string; bad: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
      <span className="w-4 text-center">{ok ? '✓' : '✗'}</span>
      <span>{ok ? good : bad}</span>
    </div>
  );
}

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
  const [rightFormErrors, setRightFormErrors] = useState<RepFormErrors | null>(null);
  const [leftFormErrors, setLeftFormErrors] = useState<RepFormErrors | null>(null);

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

        // Hip midpoint z — used for torso lean detection
        const hipMidZ = ((landmarks[23]?.z ?? 0) + (landmarks[24]?.z ?? 0)) / 2;

        if (isArmVisible(rightArm)) {
          const rawAngle = calculateAngle(rightArm.shoulder, rightArm.elbow, rightArm.wrist);
          rightAngleBufferRef.current.push(rawAngle);
          if (rightAngleBufferRef.current.length > ANGLE_BUFFER_SIZE) rightAngleBufferRef.current.shift();
          const rightAngle = rightAngleBufferRef.current.reduce((a, b) => a + b, 0) / rightAngleBufferRef.current.length;

          const elbowDrift = rightArm.shoulder.z - rightArm.elbow.z;
          const torsoZ     = rightArm.shoulder.z - hipMidZ;

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
                baselineTorsoZ: torsoZ,
              };
              rightMaxExtensionRef.current = 0;
            }
          } else {
            // In 'up' phase: accumulate form metrics every frame
            const acc = rightRepAccRef.current;
            acc.minAngle          = Math.min(acc.minAngle, rightAngle);
            acc.maxElbowDrift     = Math.max(acc.maxElbowDrift, elbowDrift);
            acc.maxTorsoLeanDelta = Math.max(acc.maxTorsoLeanDelta, Math.abs(torsoZ - acc.baselineTorsoZ));

            if (rightAngle > CURL_DOWN_THRESHOLD) {
              // Transition up → down: rep complete — evaluate form
              rightCurlStateRef.current = 'down';
              rightRepCountRef.current += 1;
              setRightReps(rightRepCountRef.current);
              const errors: RepFormErrors = {
                incompleteFlexion:   acc.minAngle > FLEX_QUALITY_THRESHOLD,
                incompleteExtension: acc.extensionAngle < EXTEND_QUALITY_THRESHOLD,
                elbowDrift:          acc.maxElbowDrift > ELBOW_DRIFT_THRESHOLD,
                torsoLean:           acc.maxTorsoLeanDelta > TORSO_LEAN_THRESHOLD,
              };
              setRightFormErrors(errors);
              console.log('[Form] Right rep', rightRepCountRef.current, errors);
            }
          }

          drawAngleLabel(ctx, rightArm.elbow, rightAngle, 'R');
        }

        if (isArmVisible(leftArm)) {
          const rawAngle = calculateAngle(leftArm.shoulder, leftArm.elbow, leftArm.wrist);
          leftAngleBufferRef.current.push(rawAngle);
          if (leftAngleBufferRef.current.length > ANGLE_BUFFER_SIZE) leftAngleBufferRef.current.shift();
          const leftAngle = leftAngleBufferRef.current.reduce((a, b) => a + b, 0) / leftAngleBufferRef.current.length;

          const elbowDrift = leftArm.shoulder.z - leftArm.elbow.z;
          const torsoZ     = leftArm.shoulder.z - hipMidZ;

          if (leftCurlStateRef.current === 'down') {
            leftMaxExtensionRef.current = Math.max(leftMaxExtensionRef.current, leftAngle);
            if (leftAngle < CURL_UP_THRESHOLD) {
              leftCurlStateRef.current = 'up';
              leftRepAccRef.current = {
                ...newRepAcc(),
                extensionAngle: leftMaxExtensionRef.current,
                minAngle: leftAngle,
                maxElbowDrift: elbowDrift,
                baselineTorsoZ: torsoZ,
              };
              leftMaxExtensionRef.current = 0;
            }
          } else {
            const acc = leftRepAccRef.current;
            acc.minAngle          = Math.min(acc.minAngle, leftAngle);
            acc.maxElbowDrift     = Math.max(acc.maxElbowDrift, elbowDrift);
            acc.maxTorsoLeanDelta = Math.max(acc.maxTorsoLeanDelta, Math.abs(torsoZ - acc.baselineTorsoZ));

            if (leftAngle > CURL_DOWN_THRESHOLD) {
              leftCurlStateRef.current = 'down';
              leftRepCountRef.current += 1;
              setLeftReps(leftRepCountRef.current);
              const errors: RepFormErrors = {
                incompleteFlexion:   acc.minAngle > FLEX_QUALITY_THRESHOLD,
                incompleteExtension: acc.extensionAngle < EXTEND_QUALITY_THRESHOLD,
                elbowDrift:          acc.maxElbowDrift > ELBOW_DRIFT_THRESHOLD,
                torsoLean:           acc.maxTorsoLeanDelta > TORSO_LEAN_THRESHOLD,
              };
              setLeftFormErrors(errors);
              console.log('[Form] Left rep', leftRepCountRef.current, errors);
            }
          }

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
    setRightFormErrors(null);
    setLeftFormErrors(null);
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

      {/* Rep counters */}
      {isDetecting && (
        <div className="flex gap-6 justify-center">
          {[{ label: 'Right Arm', count: rightReps }, { label: 'Left Arm', count: leftReps }].map(({ label, count }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-8 py-4 bg-slate-800 rounded-2xl border border-indigo-500/30">
              <span className="text-slate-400 text-sm font-medium">{label}</span>
              <span className="text-5xl font-bold text-white tabular-nums">{count}</span>
              <span className="text-slate-500 text-xs">reps</span>
            </div>
          ))}
        </div>
      )}

      {/* Form feedback — shown after each rep */}
      {isDetecting && (rightFormErrors !== null || leftFormErrors !== null) && (
        <div className="flex gap-6 justify-center flex-wrap">
          {([
            { label: 'Right Arm', errors: rightFormErrors },
            { label: 'Left Arm',  errors: leftFormErrors  },
          ] as const).filter(({ errors }) => errors !== null).map(({ label, errors }) => {
            const e = errors!;
            const allGood = !e.incompleteFlexion && !e.incompleteExtension && !e.elbowDrift && !e.torsoLean;
            return (
              <div key={label} className={`flex flex-col gap-2 px-6 py-4 bg-slate-800/80 rounded-2xl border min-w-[220px] ${allGood ? 'border-emerald-500/40' : 'border-red-500/40'}`}>
                <span className="text-slate-300 text-sm font-semibold">{label} — Last Rep</span>
                <FormCheck ok={!e.incompleteFlexion}   good="Full curl"        bad="Curl deeper (incomplete flexion)" />
                <FormCheck ok={!e.incompleteExtension} good="Full extension"   bad="Extend fully at bottom" />
                <FormCheck ok={!e.elbowDrift}          good="Elbow stable"     bad="Elbow drifted forward" />
                <FormCheck ok={!e.torsoLean}           good="Torso straight"   bad="Torso leaning back" />
              </div>
            );
          })}
        </div>
      )}

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
