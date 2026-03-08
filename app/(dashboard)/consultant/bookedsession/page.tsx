'use client';

import { useState, useEffect } from 'react';

export default function BookedSessionPage() {
  const [stats, setStats] = useState<any>(null);
  const consultantId = "YOUR_CONSULTANT_ID"; // we'll fix this with auth later

  useEffect(() => {
    fetch(`/api/consultant/bookedsession?consultant_id=${consultantId}`)
      .then(res => res.json())
      .then(result => {
        if (result.ok) setStats(result.data);
      });
  }, []);

  return (
    <div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Booked Sessions</h1>
        <p className="text-gray-600 mt-1">Manage and track all your sessions.</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex justify-between items-center">
          <p className="text-gray-500">Total Sessions</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex justify-between items-center">
          <p className="text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-500">{stats?.confirmed || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex justify-between items-center">
          <p className="text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-orange-500">{stats?.pending || 0}</p>
        </div>
      </div>
    </div>
  );
}
