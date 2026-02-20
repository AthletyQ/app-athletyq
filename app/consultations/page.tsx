import Navbar from "@/components/dashboard/Navbar";
import ConsultationsClient from "@/components/consultations/ConsultationsClient";
import { getConsultationSessions } from "@/services/consultations";
import { Stethoscope } from "lucide-react";

export default async function ConsultationsPage() {
  const sessions = await getConsultationSessions();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
            <p className="text-gray-500 mt-1 text-sm">
              View past and upcoming sessions
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-3 rounded-xl transition-colors">
            <Stethoscope className="w-4 h-4" />
            Consult a Doctor
          </button>
        </div>

        <ConsultationsClient sessions={sessions} />
      </main>
    </div>
  );
}