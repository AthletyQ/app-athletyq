"use client";

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  User, Users, HeartPulse, ChevronRight, ChevronLeft,
  Check, Plus, Trash2, Upload, FileText, X,
  Mail, Zap, Eye, EyeOff, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";


type Role = "athlete" | "coach" | "wellness_professional" | null;
type WellnessType = "sport_doctor" | "physiotherapist" | "nutritionist" | "";

interface Qualification { title: string; institution: string; year: string; file: File | null; }
interface Sport { id: number; name: string; }

interface AthleteForm {
  firstName: string; lastName: string; email: string; phone: string;
  password: string; confirmPassword: string;
  age: string; weight: string; height: string; preferredSportId: number | null;
}
interface CoachForm {
  firstName: string; lastName: string; email: string; phone: string;
  password: string; confirmPassword: string;
  coachingSportId: number | null; qualifications: Qualification[];
}
interface WellnessForm {
  firstName: string; lastName: string; email: string; phone: string;
  password: string; confirmPassword: string;
  wellnessType: WellnessType; qualifications: Qualification[];
}

const WELLNESS_TYPES = [
  { id: "sport_doctor", label: "Sport Doctor", icon: "🩺", desc: "Clinical care & injury mgmt" },
  { id: "physiotherapist", label: "Physiotherapist", icon: "🦴", desc: "Rehab & movement therapy" },
  { id: "nutritionist", label: "Nutritionist", icon: "🥗", desc: "Diet, fuelling & body comp" },
];

const ROLES = [
  {
    id: "athlete" as Role,
    eyebrow: "COMPETING OR TRAINING",
    title: "Athlete / Talent",
    desc: "You're an individual athlete looking for structured coaching, accountability, and a clear performance plan.",
    features: ["Personal performance profile", "Sport, level & competition goals", "Schedule, constraints & preferences"],
    icon: User,
  },
  {
    id: "coach" as Role,
    eyebrow: "DELIVERING COACHING",
    title: "Coach",
    desc: "You coach athletes and need a system to manage clients, programs, and communication.",
    features: ["Coaching specialties & certifications", "Typical roster size & offerings", "Scheduling & communication preferences"],
    icon: Users,
  },
  {
    id: "wellness_professional" as Role,
    eyebrow: "SUPPORTING PERFORMANCE",
    title: "Consultant",
    desc: "You support athletes as a sport doctor, physiotherapist, or nutritionist.",
    features: ["Wellness specialty & certifications", "Client engagement structure", "Key reporting & referral needs"],
    icon: HeartPulse,
  },
];


export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [athleteForm, setAthleteForm] = useState<AthleteForm>({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "",
    age: "", weight: "", height: "", preferredSportId: null,
  });
  const [coachForm, setCoachForm] = useState<CoachForm>({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "",
    coachingSportId: null,
    qualifications: [{ title: "", institution: "", year: "", file: null }],
  });
  const [wellnessForm, setWellnessForm] = useState<WellnessForm>({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "",
    wellnessType: "",
    qualifications: [{ title: "", institution: "", year: "", file: null }],
  });

  useEffect(() => {
    async function fetchSports() {
      setSportsLoading(true);
      const { data, error } = await supabase
        .from("sports")
        .select("id, name")
        .order("name");
      if (!error && data) {
        setSports(data as Sport[]);
      }
      console.log(data);
      setSportsLoading(false);
    }
    fetchSports();
  }, []);

  const currentForm =
    selectedRole === "athlete" ? athleteForm :
      selectedRole === "coach" ? coachForm : wellnessForm;

  const buildPayload = () => {
    const form = currentForm;
    const common = {
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      role: selectedRole,
    };

    if (selectedRole === "athlete") {
      const f = form as AthleteForm;
      return {
        ...common,
        age: f.age ? Number(f.age) : undefined,
        heightCm: f.height ? Number(f.height) : undefined,
        weightKg: f.weight ? Number(f.weight) : undefined,
        preferredSportId: f.preferredSportId ?? undefined,
      };
    }

    if (selectedRole === "coach") {
      const f = form as CoachForm;
      return {
        ...common,
        coachingSportId: f.coachingSportId ?? undefined,
        coachCertifications: f.qualifications
          .filter(q => q.title)
          .map(q => `${q.title}${q.institution ? " – " + q.institution : ""}${q.year ? " (" + q.year + ")" : ""}`),
      };
    }

   
    const f = form as WellnessForm;
    return {
      ...common,
      consultantSpecialty: f.wellnessType || undefined,
      consultantCertifications: f.qualifications
        .filter(q => q.title)
        .map(q => `${q.title}${q.institution ? " – " + q.institution : ""}${q.year ? " (" + q.year + ")" : ""}`),
    };
  };

  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = buildPayload();
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setSubmitError(json?.error?.message || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* ── Header ── */}
      <header className="px-4 sm:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-gray-900 font-bold text-xl tracking-tight">AthletyQ</span>
        </div>
        {!submitted && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm">
            <span>Already have an account?</span>
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 font-bold hover:text-blue-700 transition-colors cursor-pointer"
            >
              Log in
            </button>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center px-6 py-10">
        {step === 1 && (
          <Step1
            selectedRole={selectedRole}
            onSelect={setSelectedRole}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && selectedRole === "athlete" && (
          <AthleteStep2
            form={athleteForm}
            onChange={setAthleteForm}
            sports={sports}
            sportsLoading={sportsLoading}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 2 && selectedRole === "coach" && (
          <CoachStep2
            form={coachForm}
            onChange={setCoachForm}
            sports={sports}
            sportsLoading={sportsLoading}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 2 && selectedRole === "wellness_professional" && (
          <WellnessStep2
            form={wellnessForm}
            onChange={setWellnessForm}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && !submitted && (
          <ReviewStep
            role={selectedRole!}
            form={currentForm}
            sports={sports}
            isSubmitting={isSubmitting}
            error={submitError}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}
        {step === 3 && submitted && (
          <SuccessStep email={currentForm.email} onGoToLogin={() => router.push("/login")} />
        )}
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 1 — ROLE SELECTION
══════════════════════════════════════════════════════════════ */
function Step1({ selectedRole, onSelect, onContinue }: {
  selectedRole: Role; onSelect: (r: Role) => void; onContinue: () => void;
}) {
  const router = useRouter();
  return (
    <div className="w-full max-w-5xl">
      <p className="text-sm font-semibold text-gray-400 mb-2 tracking-widest uppercase">Step 1 of 3</p>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Who is this account for?</h1>
      <ProgressBar step={1} />

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const sel = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onSelect(role.id)}
              className={`relative text-left rounded-2xl border-2 p-7 transition-all duration-200 bg-white focus:outline-none
                ${sel ? "border-blue-600 shadow-lg shadow-blue-100" : "border-transparent shadow-sm hover:border-gray-200 hover:shadow-md"}`}
            >
              {sel && (
                <span className="absolute -top-3 left-5 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  ✓ Selected
                </span>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-colors ${sel ? "bg-blue-600" : "bg-gray-100"}`}>
                <Icon size={20} className={sel ? "text-white" : "text-gray-500"} />
              </div>
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">{role.eyebrow}</p>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{role.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{role.desc}</p>
              <ul className="space-y-2">
                {role.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={13} className="text-blue-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center gap-6">
        <button
          onClick={onContinue}
          disabled={!selectedRole}
          className={`flex items-center gap-2 px-10 py-4 rounded-xl text-white font-bold text-base transition-all
            ${selectedRole ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transform hover:-translate-y-0.5" : "bg-blue-300 cursor-not-allowed"}`}
        >
          Continue <ChevronRight size={18} />
        </button>

        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 font-bold hover:text-blue-700 transition-colors cursor-pointer"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 2A — ATHLETE
══════════════════════════════════════════════════════════════ */
function AthleteStep2({ form, onChange, sports, sportsLoading, onBack, onContinue }: {
  form: AthleteForm; onChange: (f: AthleteForm) => void;
  sports: Sport[]; sportsLoading: boolean;
  onBack: () => void; onContinue: () => void;
}) {
  const set = (k: keyof AthleteForm, v: string | number | null) => onChange({ ...form, [k]: v });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const passwordsMatch = form.password === form.confirmPassword;
  const passwordLong = form.password.length >= 6;
  const valid = !!(
    form.firstName && form.lastName && form.email && form.phone &&
    form.password && form.confirmPassword && passwordsMatch && passwordLong &&
    form.age && form.preferredSportId
  );

  return (
    <FormShell step={2} title="Athlete Profile" subtitle="Tell us about yourself so we can personalise your experience."
      roleTag={{ label: "Athlete / Talent", cls: "bg-blue-50 text-blue-700" }}
      onBack={onBack} onContinue={onContinue} isValid={valid}
    >
      <SectionLabel>Personal Details</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" value={form.firstName} onChange={v => set("firstName", v)} required placeholder="John" />
        <Field label="Last Name" value={form.lastName} onChange={v => set("lastName", v)} required placeholder="Doe" />
        <Field label="Email Address" type="email" value={form.email} onChange={v => set("email", v)} required placeholder="john@example.com" />
        <Field label="Contact Number" type="tel" value={form.phone} onChange={v => set("phone", v)} required placeholder="+1 234 567 8900" />
        <Field label="Age" type="number" value={form.age} onChange={v => set("age", v)} required placeholder="e.g. 24" />
      </div>

      <SectionLabel className="mt-6">Account Security</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PasswordField label="Password" value={form.password} onChange={v => set("password", v)} show={showPw} onToggle={() => setShowPw(!showPw)} />
        <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={v => set("confirmPassword", v)} show={showCpw} onToggle={() => setShowCpw(!showCpw)} />
      </div>
      {form.password && form.confirmPassword && !passwordsMatch && (
        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
      )}
      {form.password && !passwordLong && (
        <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
      )}

      <SectionLabel className="mt-6">Physical Stats</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <UnitField label="Height" value={form.height} onChange={v => set("height", v)} unit="cm" placeholder="175" />
        <UnitField label="Weight" value={form.weight} onChange={v => set("weight", v)} unit="kg" placeholder="72" />
      </div>

      <SectionLabel className="mt-6">Preferred Sport <span className="text-blue-500">*</span></SectionLabel>
      <p className="text-xs text-gray-400 mb-3 -mt-1">Select your primary sport</p>
      {sportsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> Loading sports…</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sports.map(s => {
            const on = form.preferredSportId === s.id;
            return (
              <button key={s.id} type="button"
                onClick={() => set("preferredSportId", on ? null : s.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all
                  ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"}`}>
                {s.name}
              </button>
            );
          })}
        </div>
      )}
    </FormShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 2B — COACH
══════════════════════════════════════════════════════════════ */
function CoachStep2({ form, onChange, sports, sportsLoading, onBack, onContinue }: {
  form: CoachForm; onChange: (f: CoachForm) => void;
  sports: Sport[]; sportsLoading: boolean;
  onBack: () => void; onContinue: () => void;
}) {
  const set = (k: keyof Omit<CoachForm, "qualifications" | "coachingSportId">, v: string) => onChange({ ...form, [k]: v });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const updQ = (i: number, k: keyof Qualification, v: string | File | null) => {
    onChange({ ...form, qualifications: form.qualifications.map((q, idx) => idx === i ? { ...q, [k]: v } : q) });
  };
  const addQ = () => onChange({ ...form, qualifications: [...form.qualifications, { title: "", institution: "", year: "", file: null }] });
  const removeQ = (i: number) => onChange({ ...form, qualifications: form.qualifications.filter((_, idx) => idx !== i) });

  const passwordsMatch = form.password === form.confirmPassword;
  const passwordLong = form.password.length >= 6;
  const valid = !!(
    form.firstName && form.lastName && form.email && form.phone &&
    form.password && form.confirmPassword && passwordsMatch && passwordLong &&
    form.coachingSportId
  );

  return (
    <FormShell step={2} title="Coach Profile" subtitle="Set up your coaching profile to manage clients and programmes."
      roleTag={{ label: "Coach", cls: "bg-emerald-50 text-emerald-700" }}
      onBack={onBack} onContinue={onContinue} isValid={valid}
    >
      <SectionLabel>Personal Details</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" value={form.firstName} onChange={v => set("firstName", v)} required placeholder="Jane" />
        <Field label="Last Name" value={form.lastName} onChange={v => set("lastName", v)} required placeholder="Smith" />
        <Field label="Email Address" type="email" value={form.email} onChange={v => set("email", v)} required placeholder="jane@example.com" />
        <Field label="Contact Number" type="tel" value={form.phone} onChange={v => set("phone", v)} required placeholder="+1 234 567 8900" />
      </div>

      <SectionLabel className="mt-6">Account Security</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PasswordField label="Password" value={form.password} onChange={v => set("password", v)} show={showPw} onToggle={() => setShowPw(!showPw)} />
        <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={v => set("confirmPassword", v)} show={showCpw} onToggle={() => setShowCpw(!showCpw)} />
      </div>
      {form.password && form.confirmPassword && !passwordsMatch && (
        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
      )}
      {form.password && !passwordLong && (
        <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
      )}

      <SectionLabel className="mt-6">Coaching Sport <span className="text-blue-500">*</span></SectionLabel>
      <p className="text-xs text-gray-400 mb-3 -mt-1">Select the sport you coach</p>
      {sportsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> Loading sports…</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sports.map(s => {
            const on = form.coachingSportId === s.id;
            return (
              <button key={s.id} type="button"
                onClick={() => onChange({ ...form, coachingSportId: on ? null : s.id })}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all
                  ${on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"}`}>
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      {/* <SectionLabel className="mt-6">Qualifications & Certifications</SectionLabel>
      <div className="space-y-4">
        {form.qualifications.map((q, i) => (
          <QualCard key={i} index={i} qual={q} accentClass="text-emerald-600"
            borderClass="border-emerald-200" bgClass="bg-emerald-50" uploadColor="#059669"
            onChange={(k, v) => updQ(i, k, v)}
            onRemove={form.qualifications.length > 1 ? () => removeQ(i) : undefined}
          />
        ))}
        <button type="button" onClick={addQ}
          className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-1">
          <Plus size={15} /> Add another qualification
        </button>
      </div> */}
    </FormShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 2C — CONSULTANT (WELLNESS PROFESSIONAL)
══════════════════════════════════════════════════════════════ */
function WellnessStep2({ form, onChange, onBack, onContinue }: {
  form: WellnessForm; onChange: (f: WellnessForm) => void; onBack: () => void; onContinue: () => void;
}) {
  const set = (k: keyof Omit<WellnessForm, "qualifications" | "wellnessType">, v: string) => onChange({ ...form, [k]: v });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const updQ = (i: number, k: keyof Qualification, v: string | File | null) => {
    onChange({ ...form, qualifications: form.qualifications.map((q, idx) => idx === i ? { ...q, [k]: v } : q) });
  };
  const addQ = () => onChange({ ...form, qualifications: [...form.qualifications, { title: "", institution: "", year: "", file: null }] });
  const removeQ = (i: number) => onChange({ ...form, qualifications: form.qualifications.filter((_, idx) => idx !== i) });

  const passwordsMatch = form.password === form.confirmPassword;
  const passwordLong = form.password.length >= 6;
  const valid = !!(
    form.firstName && form.lastName && form.email && form.phone &&
    form.password && form.confirmPassword && passwordsMatch && passwordLong &&
    form.wellnessType
  );

  return (
    <FormShell step={2} title="Consultant Profile" subtitle="Help athletes perform, recover, and thrive with expert support."
      roleTag={{ label: "Consultant", cls: "bg-violet-50 text-violet-700" }}
      onBack={onBack} onContinue={onContinue} isValid={valid}
    >
      <SectionLabel>Personal Details</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" value={form.firstName} onChange={v => set("firstName", v)} required placeholder="Alex" />
        <Field label="Last Name" value={form.lastName} onChange={v => set("lastName", v)} required placeholder="Carter" />
        <Field label="Email Address" type="email" value={form.email} onChange={v => set("email", v)} required placeholder="alex@example.com" />
        <Field label="Contact Number" type="tel" value={form.phone} onChange={v => set("phone", v)} required placeholder="+1 234 567 8900" />
      </div>

      <SectionLabel className="mt-6">Account Security</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PasswordField label="Password" value={form.password} onChange={v => set("password", v)} show={showPw} onToggle={() => setShowPw(!showPw)} />
        <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={v => set("confirmPassword", v)} show={showCpw} onToggle={() => setShowCpw(!showCpw)} />
      </div>
      {form.password && form.confirmPassword && !passwordsMatch && (
        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
      )}
      {form.password && !passwordLong && (
        <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
      )}

      <SectionLabel className="mt-6">Specialisation <span className="text-blue-500">*</span></SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
        {WELLNESS_TYPES.map(wt => {
          const active = form.wellnessType === wt.id;
          return (
            <button key={wt.id} type="button"
              onClick={() => onChange({ ...form, wellnessType: wt.id as WellnessType })}
              className={`flex flex-col gap-1.5 px-4 py-4 rounded-xl border-2 text-left transition-all focus:outline-none
                ${active ? "border-violet-600 bg-violet-50" : "border-gray-200 bg-white hover:border-violet-300"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{wt.icon}</span>
                {active && (
                  <span className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className={`text-sm font-semibold ${active ? "text-violet-700" : "text-gray-700"}`}>{wt.label}</p>
              <p className="text-[11px] text-gray-400 leading-snug">{wt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* <SectionLabel className="mt-6">Qualifications & Certifications</SectionLabel>
      <div className="space-y-4">
        {form.qualifications.map((q, i) => (
          <QualCard key={i} index={i} qual={q} accentClass="text-violet-600"
            borderClass="border-violet-200" bgClass="bg-violet-50" uploadColor="#7C3AED"
            onChange={(k, v) => updQ(i, k, v)}
            onRemove={form.qualifications.length > 1 ? () => removeQ(i) : undefined}
          />
        ))}
        <button type="button" onClick={addQ}
          className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors mt-1">
          <Plus size={15} /> Add another qualification
        </button>
      </div> */}
    </FormShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 3 — REVIEW & SUBMIT
══════════════════════════════════════════════════════════════ */
function ReviewStep({ role, form, sports, isSubmitting, error, onBack, onSubmit }: {
  role: NonNullable<Role>;
  form: AthleteForm | CoachForm | WellnessForm;
  sports: Sport[];
  isSubmitting: boolean;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const roleName =
    role === "athlete" ? "Athlete / Talent" :
      role === "coach" ? "Coach" : "Consultant";

  const roleColor =
    role === "athlete" ? "blue" :
      role === "coach" ? "emerald" : "violet";

  const getSportName = (id: number | null) => {
    if (!id) return "—";
    return sports.find(s => s.id === id)?.name || "—";
  };

  return (
    <div className="w-full max-w-2xl">
      <p className="text-sm font-semibold text-gray-400 mb-2 tracking-widest uppercase text-center">Step 3 of 3</p>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1 text-center">Review & Create Account</h1>
      <p className="text-sm text-gray-500 text-center mb-5">
        Please review your details. We&apos;ll send a confirmation link to your email.
      </p>
      <ProgressBar step={3} />

      <div className="flex justify-center mt-4 mb-6">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-${roleColor}-50 text-${roleColor}-700`}>{roleName}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* Personal info */}
        <SectionLabel>Personal Details</SectionLabel>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <ReviewRow label="First Name" value={form.firstName} />
          <ReviewRow label="Last Name" value={form.lastName} />
          <ReviewRow label="Email" value={form.email} />
          <ReviewRow label="Phone" value={form.phone || "—"} />
        </div>

        {/* Role-specific */}
        {role === "athlete" && (
          <>
            <SectionLabel>Athlete Details</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
              <ReviewRow label="Age" value={(form as AthleteForm).age || "—"} />
              <ReviewRow label="Height" value={(form as AthleteForm).height ? `${(form as AthleteForm).height} cm` : "—"} />
              <ReviewRow label="Weight" value={(form as AthleteForm).weight ? `${(form as AthleteForm).weight} kg` : "—"} />
              <ReviewRow label="Preferred Sport" value={getSportName((form as AthleteForm).preferredSportId)} />
            </div>
          </>
        )}

        {role === "coach" && (
          <>
            <SectionLabel>Coaching Details</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
              <ReviewRow label="Coaching Sport" value={getSportName((form as CoachForm).coachingSportId)} />
              <ReviewRow label="Certifications"
                value={(form as CoachForm).qualifications.filter(q => q.title).map(q => q.title).join(", ") || "—"} />
            </div>
          </>
        )}

        {role === "wellness_professional" && (
          <>
            <SectionLabel>Consultant Details</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
              <ReviewRow label="Specialisation"
                value={WELLNESS_TYPES.find(w => w.id === (form as WellnessForm).wellnessType)?.label || "—"} />
              <ReviewRow label="Certifications"
                value={(form as WellnessForm).qualifications.filter(q => q.title).map(q => q.title).join(", ") || "—"} />
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
          <button onClick={onBack} disabled={isSubmitting}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={onSubmit} disabled={isSubmitting}
            className={`flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm transition-all
              ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"}`}>
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Creating Account…</>
            ) : (
              <>Create Account <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 3 — SUCCESS (Check your email)
══════════════════════════════════════════════════════════════ */
function SuccessStep({ email, onGoToLogin }: { email: string; onGoToLogin: () => void }) {
  const maskEmail = (e: string) => {
    const [user, domain] = e.split("@");
    if (!user || !domain) return e;
    return user.slice(0, 2) + "****@" + domain;
  };

  return (
    <div className="w-full max-w-lg text-center">
      <ProgressBar step={3} />

      <div className="mt-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center">
        {/* Mail icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200">
              <Mail size={34} className="text-white" strokeWidth={2} />
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 opacity-50 scale-110" />
          <div className="absolute inset-0 rounded-full border border-blue-100 opacity-30 scale-125" />
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Check your email ✉️</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
          We&apos;ve sent a confirmation link to{" "}
          <span className="font-semibold text-gray-800">{maskEmail(email)}</span>.
          Click the link to activate your account.
        </p>

        <div className="w-full mt-7 bg-gray-50 rounded-xl border border-gray-100 px-5 py-4 text-left space-y-2.5">
          <div className="flex items-center gap-3">
            <Mail size={15} className="text-blue-500 shrink-0" />
            <span className="text-xs text-gray-500">Sent to:</span>
            <span className="text-xs font-semibold text-gray-800 ml-auto">{maskEmail(email)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Check size={15} className="text-green-500 shrink-0" />
            <span className="text-xs text-gray-500">Status:</span>
            <span className="text-xs font-semibold text-amber-600 ml-auto">Awaiting confirmation</span>
          </div>
        </div>

        <button onClick={onGoToLogin}
          className="mt-7 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-200">
          Go to Login <ChevronRight size={16} />
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Didn&apos;t receive the email? Check your spam folder.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARED — REVIEW ROW
══════════════════════════════════════════════════════════════ */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-gray-800 font-medium">{value}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARED — QUAL CARD
══════════════════════════════════════════════════════════════ */
function QualCard({ index, qual, accentClass, borderClass, bgClass, uploadColor, onChange, onRemove }: {
  index: number; qual: Qualification;
  accentClass: string; borderClass: string; bgClass: string; uploadColor: string;
  onChange: (k: keyof Qualification, v: string | File | null) => void;
  onRemove?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative">
      {onRemove && (
        <button type="button" onClick={onRemove}
          className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      )}
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${accentClass}`}>
        Qualification {index + 1}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Certificate / Qualification Title"
          value={qual.title} onChange={v => onChange("title", v)}
          placeholder="e.g. UEFA A Licence" className="sm:col-span-2" />
        <Field label="Issuing Institution"
          value={qual.institution} onChange={v => onChange("institution", v)}
          placeholder="e.g. UEFA / University" />
        <Field label="Year Obtained" type="number"
          value={qual.year} onChange={v => onChange("year", v)}
          placeholder="e.g. 2021" />
      </div>

      {/* PDF upload */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Upload Certificate <span className="text-gray-400 font-normal">(PDF)</span>
        </p>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden"
          onChange={e => onChange("file", e.target.files?.[0] ?? null)} />
        {qual.file ? (
          <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${borderClass} ${bgClass}`}>
            <div className="flex items-center gap-2.5">
              <FileText size={15} style={{ color: uploadColor }} />
              <span className="text-sm text-gray-700 font-medium truncate max-w-[200px]">{qual.file.name}</span>
            </div>
            <button type="button" onClick={() => onChange("file", null)}
              className="text-gray-400 hover:text-red-400 transition-colors ml-3 shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3.5 text-sm font-medium transition-all ${borderClass}`}
            style={{ color: uploadColor }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = uploadColor + "0D"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <Upload size={15} /> Click to upload PDF
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARED — FORM SHELL
══════════════════════════════════════════════════════════════ */
function FormShell({ step, title, subtitle, roleTag, children, onBack, onContinue, isValid }: {
  step: number; title: string; subtitle: string;
  roleTag: { label: string; cls: string };
  children: React.ReactNode;
  onBack: () => void; onContinue: () => void; isValid: boolean;
}) {
  return (
    <div className="w-full max-w-2xl">
      <p className="text-sm font-semibold text-gray-400 mb-2 tracking-widest uppercase text-center">
        Step {step} of 3
      </p>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1 text-center">{title}</h1>
      <p className="text-sm text-gray-500 text-center mb-5">{subtitle}</p>
      <ProgressBar step={step} />

      <div className="flex justify-center mt-4 mb-8">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleTag.cls}`}>{roleTag.label}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {children}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={onContinue} disabled={!isValid}
            className={`flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm transition-all
              ${isValid ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200" : "bg-blue-300 cursor-not-allowed"}`}>
            Continue <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRIMITIVES
══════════════════════════════════════════════════════════════ */
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map(s => (
        <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-blue-600" : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 ${className}`}>
      {children}
    </p>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required, className = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-blue-500 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
      />
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}<span className="text-blue-500 ml-0.5">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function UnitField({ label, value, onChange, unit, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; unit: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        <input type="number" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
          className="flex-1 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent" />
        <span className="px-3 flex items-center bg-gray-50 border-l border-gray-200 text-sm text-gray-500 font-semibold shrink-0">
          {unit}
        </span>
      </div>
    </div>
  );
}
