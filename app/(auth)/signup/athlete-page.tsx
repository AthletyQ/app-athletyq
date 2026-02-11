'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AthleteSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    sport: '',
    level: '',
    goals: '',
    availability: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Athlete signup data:', formData);
    // router.push('/signup/complete'); // Navigate to step 3
  };

  const handleBack = () => {
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-12">
          <p className="text-xs font-medium tracking-widest text-slate-500 uppercase mb-3">
            Step 2 of 3
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Athlete Profile
          </h1>
          <p className="text-slate-600 mb-8">
            Tell us about your athletic background and goals
          </p>
          
          {/* Progress bar */}
          <div className="flex gap-2">
            <div className="h-1 flex-1 bg-blue-600 rounded-full" />
            <div className="h-1 flex-1 bg-blue-600 rounded-full" />
            <div className="h-1 flex-1 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Athletic Profile */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Athletic Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Sport
                </label>
                <select
                  id="sport"
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select a sport</option>
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="swimming">Swimming</option>
                  <option value="triathlon">Triathlon</option>
                  <option value="basketball">Basketball</option>
                  <option value="soccer">Soccer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-2">
                  Competition Level
                </label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select your level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite / Professional</option>
                </select>
              </div>

              <div>
                <label htmlFor="goals" className="block text-sm font-medium text-slate-700 mb-2">
                  Training Goals
                </label>
                <textarea
                  id="goals"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="What are your primary goals? (e.g., improve endurance, compete in marathons, lose weight)"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-slate-700 mb-2">
                  Weekly Training Availability
                </label>
                <select
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select availability</option>
                  <option value="1-3">1-3 hours per week</option>
                  <option value="4-6">4-6 hours per week</option>
                  <option value="7-10">7-10 hours per week</option>
                  <option value="10+">10+ hours per week</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-300"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
