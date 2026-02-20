import Navbar from "@/components/dashboard/Navbar";
import CoachesClient from "@/components/coaches/CoachesClient";
import { getCoaches } from "@/services/coaches";

export default async function CoachesPage() {
  const coaches = await getCoaches();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coaches & Doctors</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Find and book consultations with experts
          </p>
        </div>
        <CoachesClient coaches={coaches} />
      </main>
    </div>
  );
}