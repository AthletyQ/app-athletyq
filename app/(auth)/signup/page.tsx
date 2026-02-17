'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AccountType = 'athlete' | 'coach' | 'consultant' | null;

export default function SignupPage() {
  const [selectedType, setSelectedType] = useState<AccountType>('athlete');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedType) {
      // Navigate to next step or handle signup
      console.log('Selected account type:', selectedType);
      // router.push(`/signup/${selectedType}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        {/* Progress indicator */}
        <div className="mb-12">
          <p className="text-xs font-medium tracking-widest text-slate-500 uppercase mb-3">
            Step 1 of 3
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 tracking-tight">
            Who is this account for?
          </h1>
          
          {/* Progress bar */}
          <div className="flex gap-2">
            <div className="h-1 flex-1 bg-blue-600 rounded-full" />
            <div className="h-1 flex-1 bg-slate-200 rounded-full" />
            <div className="h-1 flex-1 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* Account type cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Athlete / Talent */}
          <button
            onClick={() => setSelectedType('athlete')}
            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-xl hover:-translate-y-1 ${
              selectedType === 'athlete'
                ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            {selectedType === 'athlete' && (
              <div className="absolute -top-3 left-6">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Selected
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                selectedType === 'athlete' ? 'bg-blue-600' : 'bg-slate-100 group-hover:bg-blue-100'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  selectedType === 'athlete' ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Competing or Training
            </p>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Athlete / Talent
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              You're an individual athlete looking for structured coaching, accountability, and a clear performance plan.
            </p>

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Personal performance profile</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sport, level & competition goals</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Schedule, constraints & preferences</span>
              </div>
            </div>
          </button>

          {/* Coach */}
          <button
            onClick={() => setSelectedType('coach')}
            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-xl hover:-translate-y-1 ${
              selectedType === 'coach'
                ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            {selectedType === 'coach' && (
              <div className="absolute -top-3 left-6">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Selected
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                selectedType === 'coach' ? 'bg-blue-600' : 'bg-slate-100 group-hover:bg-blue-100'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  selectedType === 'coach' ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Delivering Coaching
            </p>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Coach
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              You coach athletes and need a system to manage clients, programs, and communication.
            </p>

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Coaching specialties & certifications</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Typical roster size & offerings</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Scheduling & communication preferences</span>
              </div>
            </div>
          </button>

          {/* Consultant */}
          <button
            onClick={() => setSelectedType('consultant')}
            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-xl hover:-translate-y-1 ${
              selectedType === 'consultant'
                ? ' '
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            {selectedType === 'consultant' && (
              <div className="absolute -top-3 left-6">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Selected
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                selectedType === 'consultant' ? 'bg-blue-600' : 'bg-slate-100 group-hover:bg-blue-100'
              }`}>
                <svg className={`w-5 h-5 transition-colors ${
                  selectedType === 'consultant' ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Advising Programs
            </p>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Consultant
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              You consult for athletes, teams, or organizations and need a workspace for projects, deliverables, and performance visibility.
            </p>

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Primary consulting focus & services</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Typical engagement structure</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Key stakeholders & reporting needs</span>
              </div>
            </div>
          </button>
        </div>

        {/* Continue button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className="group relative px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-lg flex items-center gap-2"
          >
            <span>Continue</span>
            <svg 
              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
