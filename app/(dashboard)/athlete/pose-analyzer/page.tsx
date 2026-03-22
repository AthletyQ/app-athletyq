'use client';

import { useState } from 'react';
import { BicepsFlexed, Activity, ArrowUpFromLine, Dumbbell, Weight, MoveHorizontal } from 'lucide-react';
import PoseDetector from '@/components/pose-analyzer/PoseDetector';

interface Workout {
  id: string;
  name: string;
  description: string;
  muscles: string[];
  available: boolean;
  icon: React.ReactNode;
}

const workouts: Workout[] = [
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    description: 'Track elbow angle, rep count, and form quality for dumbbell or barbell curls.',
    muscles: ['Biceps', 'Forearms'],
    available: true,
    icon: (
      <BicepsFlexed className="w-7 h-7" strokeWidth={1.5} />
    ),
  },
  {
    id: 'squat',
    name: 'Squat',
    description: 'Monitor knee tracking, hip depth, and spine alignment during squats.',
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    available: false,
    icon: (
      <Activity className="w-7 h-7" strokeWidth={1.5} />
    ),
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    description: 'Analyze elbow flare, body alignment, and range of motion for push-ups.',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    available: false,
    icon: (
      <ArrowUpFromLine className="w-7 h-7" strokeWidth={1.5} />
    ),
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    description: 'Track overhead press path, elbow position, and lockout quality.',
    muscles: ['Shoulders', 'Triceps', 'Traps'],
    available: false,
    icon: (
      <Dumbbell className="w-7 h-7" strokeWidth={1.5} />
    ),
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'Monitor spine neutrality, hip hinge pattern, and bar path.',
    muscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    available: false,
    icon: (
      <Weight className="w-7 h-7" strokeWidth={1.5} />
    ),
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    description: 'Detect arm elevation angle, symmetry, and momentum usage.',
    muscles: ['Side Delts', 'Traps'],
    available: false,
    icon: (
      <MoveHorizontal className="w-7 h-7" strokeWidth={1.5} />
    ),
  },
];

export default function PoseAnalyzerPage() {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  if (selectedWorkout === 'bicep-curl') {
    return (
      <main className="px-6 py-8 flex flex-col gap-6 min-h-screen">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedWorkout(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Change Workout
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-900">Bicep Curl</span>
        </div>
        <PoseDetector />
      </main>
    );
  }

  return (
    <main className="px-6 py-10 flex flex-col gap-8 min-h-screen">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SmartPose <span className="text-gray-400 font-normal">Analyzer</span>
        </h1>
        <p className="text-sm text-gray-500">
          Select a workout to begin real-time AI form analysis.
        </p>
      </div>

      {/* Workout grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        {workouts.map((workout) => (
          <button
            key={workout.id}
            onClick={() => workout.available && setSelectedWorkout(workout.id)}
            disabled={!workout.available}
            className={`
              relative text-left rounded-2xl border p-5 transition-all duration-150
              ${workout.available
                ? 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer group'
                : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
              }
            `}
          >
            {/* Available badge */}
            {workout.available && (
              <span className="absolute top-4 right-4 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Live
              </span>
            )}
            {!workout.available && (
              <span className="absolute top-4 right-4 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Soon
              </span>
            )}

            {/* Icon */}
            <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center ${workout.available ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-gray-100 text-gray-400'}`}>
              {workout.icon}
            </div>

            {/* Name + description */}
            <h2 className="text-base font-bold text-gray-900 mb-1">{workout.name}</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{workout.description}</p>

            {/* Muscle tags */}
            <div className="flex flex-wrap gap-1.5">
              {workout.muscles.map((m) => (
                <span
                  key={m}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${workout.available ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  {m}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
