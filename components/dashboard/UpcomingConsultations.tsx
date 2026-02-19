import Image from "next/image";

interface Consultation {
  id: number;
  name: string;
  role: string;
  avatarUrl: string;
  date: string;
  time: string;
}

const consultations: Consultation[] = [
  {
    id: 1,
    name: "Dr. Emily Chen",
    role: "Physiotherapy",
    avatarUrl: "https://i.pravatar.cc/40?img=47",
    date: "2026-02-18",
    time: "11:00 AM",
  },
  {
    id: 2,
    name: "Coach James Park",
    role: "Athletic Performance",
    avatarUrl: "https://i.pravatar.cc/40?img=12",
    date: "2026-02-20",
    time: "3:00 PM",
  },
  {
    id: 3,
    name: "Coach Lisa Wang",
    role: "Yoga & Recovery",
    avatarUrl: "https://i.pravatar.cc/40?img=45",
    date: "2026-02-22",
    time: "4:00 PM",
  },
];

export default function UpcomingConsultations() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <h2 className="font-semibold text-gray-800">Upcoming Consultations</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {consultations.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={c.avatarUrl}
                  alt={c.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                <p className="text-xs text-gray-400">{c.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700 font-medium">{c.date}</p>
              <p className="text-xs text-gray-400">{c.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
