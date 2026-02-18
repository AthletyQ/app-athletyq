"use client";

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import {
  User, Users, HeartPulse, ChevronRight, ChevronLeft,
  Check, Plus, Trash2, Upload, FileText, X,
  Mail, Phone, RefreshCw, ShieldCheck, Zap,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type Role = "athlete" | "coach" | "wellness" | null;
type VerifyMethod = "email" | "phone" | null;
type OtpStep = "choose" | "enter" | "success";
type WellnessType = "sport_doctor" | "physiotherapist" | "nutritionist" | "";

interface Qualification { title: string; institution: string; year: string; file: File | null; }

interface AthleteForm {
  firstName: string; lastName: string; email: string; phone: string;
  address: string; age: string; weight: string; height: string; sports: string[];
}
interface CoachForm {
  firstName: string; lastName: string; email: string; phone: string;
  address: string; sports: string[]; qualifications: Qualification[];
}
interface WellnessForm {
  firstName: string; lastName: string; email: string; phone: string;
  address: string; wellnessType: WellnessType; qualifications: Qualification[];
}

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */
const SPORTS = [
  "Football", "Basketball", "Tennis", "Swimming", "Athletics",
  "Cycling", "Rugby", "Cricket", "Boxing", "Gymnastics",
  "Volleyball", "Baseball", "Golf", "MMA", "CrossFit", "Other",
];

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
    id: "wellness" as Role,
    eyebrow: "SUPPORTING PERFORMANCE",
    title: "Wellness Professional",
    desc: "You support athletes as a sport doctor, physiotherapist, or nutritionist.",
    features: ["Wellness specialty & certifications", "Client engagement structure", "Key reporting & referral needs"],
    icon: HeartPulse,
  },
];

/* ══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════ */
export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const [athleteForm, setAthleteForm] = useState<AthleteForm>({
    firstName: "", lastName: "", email: "", phone: "", address: "", age: "", weight: "", height: "", sports: [],
  });
  const [coachForm, setCoachForm] = useState<CoachForm>({
    firstName: "", lastName: "", email: "", phone: "", address: "", sports: [],
    qualifications: [{ title: "", institution: "", year: "", file: null }],
  });
  const [wellnessForm, setWellnessForm] = useState<WellnessForm>({
    firstName: "", lastName: "", email: "", phone: "", address: "", wellnessType: "",
    qualifications: [{ title: "", institution: "", year: "", file: null }],
  });

  const currentEmail =
    selectedRole === "athlete" ? athleteForm.email :
      selectedRole === "coach" ? coachForm.email : wellnessForm.email;

  const currentPhone =
    selectedRole === "athlete" ? athleteForm.phone :
      selectedRole === "coach" ? coachForm.phone : wellnessForm.phone;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* ── Header ── */}
      <header className="px-10 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-gray-900 font-bold text-xl tracking-tight">AthleteQ</span>
        </div>
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
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 2 && selectedRole === "coach" && (
          <CoachStep2
            form={coachForm}
            onChange={setCoachForm}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 2 && selectedRole === "wellness" && (
          <WellnessStep2
            form={wellnessForm}
            onChange={setWellnessForm}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <VerifyStep
            email={currentEmail}
            phone={currentPhone}
            onBack={() => setStep(2)}
          />
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

      <div className="mt-10 flex justify-center">
        <button
          onClick={onContinue}
          disabled={!selectedRole}
          className={`flex items-center gap-2 px-10 py-4 rounded-xl text-white font-semibold text-base transition-all
            ${selectedRole ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-blue-300 cursor-not-allowed"}`}
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 2A — ATHLETE
══════════════════════════════════════════════════════════════ */
function AthleteStep2({ form, onChange, onBack, onContinue }: {
  form: AthleteForm; onChange: (f: AthleteForm) => void; onBack: () => void; onContinue: () => void;
}) {
  const set = (k: keyof AthleteForm, v: string) => onChange({ ...form, [k]: v });
  const toggleSport = (s: string) => {
    const next = form.sports.includes(s) ? form.sports.filter(x => x !== s) : [...form.sports, s];
    onChange({ ...form, sports: next });
  };
  const valid = !!(form.firstName && form.lastName && form.email && form.phone && form.age && form.sports.length);

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
        <Field label="Address" value={form.address} onChange={v => set("address", v)} placeholder="Street, City, Country" className="sm:col-span-2" />
        <Field label="Age" type="number" value={form.age} onChange={v => set("age", v)} required placeholder="e.g. 24" />
      </div>

      <SectionLabel className="mt-6">Physical Stats</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <UnitField label="Height" value={form.height} onChange={v => set("height", v)} unit="cm" placeholder="175" />
        <UnitField label="Weight" value={form.weight} onChange={v => set("weight", v)} unit="kg" placeholder="72" />
      </div>

      <SectionLabel className="mt-6">Preferred Sport(s) <span className="text-blue-500">*</span></SectionLabel>
      <p className="text-xs text-gray-400 mb-3 -mt-1">Select all that apply</p>
      <div className="flex flex-wrap gap-2">
        {SPORTS.map(s => {
          const on = form.sports.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggleSport(s)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all
                ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"}`}>
              {s}
            </button>
          );
        })}
      </div>
    </FormShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 2B — COACH
══════════════════════════════════════════════════════════════ */
function CoachStep2({ form, onChange, onBack, onContinue }: {
  form: CoachForm; onChange: (f: CoachForm) => void; onBack: () => void; onContinue: () => void;
}) {
  const set = (k: keyof Omit<CoachForm, "sports" | "qualifications">, v: string) => onChange({ ...form, [k]: v });
  const toggleSport = (s: string) => {
    const next = form.sports.includes(s) ? form.sports.filter(x => x !== s) : [...form.sports, s];
    onChange({ ...form, sports: next });
  };
  const updQ = (i: number, k: keyof Qualification, v: string | File | null) => {
    onChange({ ...form, qualifications: form.qualifications.map((q, idx) => idx === i ? { ...q, [k]: v } : q) });
  };
  const addQ = () => onChange({ ...form, qualifications: [...form.qualifications, { title: "", institution: "", year: "", file: null }] });
  const removeQ = (i: number) => onChange({ ...form, qualifications: form.qualifications.filter((_, idx) => idx !== i) });
  const valid = !!(form.firstName && form.lastName && form.email && form.phone && form.sports.length);

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
        <Field label="Address" value={form.address} onChange={v => set("address", v)} placeholder="Street, City, Country" className="sm:col-span-2" />
      </div>

      <SectionLabel className="mt-6">Sports Coached <span className="text-blue-500">*</span></SectionLabel>
      <p className="text-xs text-gray-400 mb-3 -mt-1">Select all that apply</p>
      <div className="flex flex-wrap gap-2">
        {SPORTS.map(s => {
          const on = form.sports.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggleSport(s)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all
                ${on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"}`}>
              {s}
            </button>
          );
        })}
      </div>

      <SectionLabel className="mt-6">Qualifications & Certifications</SectionLabel>
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
      </div>
    </FormShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 2C — WELLNESS
══════════════════════════════════════════════════════════════ */
function WellnessStep2({ form, onChange, onBack, onContinue }: {
  form: WellnessForm; onChange: (f: WellnessForm) => void; onBack: () => void; onContinue: () => void;
}) {
  const set = (k: keyof Omit<WellnessForm, "qualifications" | "wellnessType">, v: string) => onChange({ ...form, [k]: v });
  const updQ = (i: number, k: keyof Qualification, v: string | File | null) => {
    onChange({ ...form, qualifications: form.qualifications.map((q, idx) => idx === i ? { ...q, [k]: v } : q) });
  };
  const addQ = () => onChange({ ...form, qualifications: [...form.qualifications, { title: "", institution: "", year: "", file: null }] });
  const removeQ = (i: number) => onChange({ ...form, qualifications: form.qualifications.filter((_, idx) => idx !== i) });
  const valid = !!(form.firstName && form.lastName && form.email && form.phone && form.wellnessType);

  return (
    <FormShell step={2} title="Wellness Professional Profile" subtitle="Help athletes perform, recover, and thrive with expert support."
      roleTag={{ label: "Wellness Professional", cls: "bg-violet-50 text-violet-700" }}
      onBack={onBack} onContinue={onContinue} isValid={valid}
    >
      <SectionLabel>Personal Details</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" value={form.firstName} onChange={v => set("firstName", v)} required placeholder="Alex" />
        <Field label="Last Name" value={form.lastName} onChange={v => set("lastName", v)} required placeholder="Carter" />
        <Field label="Email Address" type="email" value={form.email} onChange={v => set("email", v)} required placeholder="alex@example.com" />
        <Field label="Contact Number" type="tel" value={form.phone} onChange={v => set("phone", v)} required placeholder="+1 234 567 8900" />
        <Field label="Address" value={form.address} onChange={v => set("address", v)} placeholder="Street, City, Country" className="sm:col-span-2" />
      </div>

      <SectionLabel className="mt-6">Wellness Specialisation <span className="text-blue-500">*</span></SectionLabel>
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

      <SectionLabel className="mt-6">Qualifications & Certifications</SectionLabel>
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
      </div>
    </FormShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEP 3 — VERIFY
══════════════════════════════════════════════════════════════ */
function VerifyStep({ email, phone, onBack }: { email: string; phone: string; onBack: () => void }) {
  const [otpStep, setOtpStep] = useState<OtpStep>("choose");
  const [method, setMethod] = useState<VerifyMethod>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const maskEmail = (e: string) => {
    const [user, domain] = e.split("@");
    if (!user || !domain) return e;
    return user.slice(0, 2) + "****@" + domain;
  };
  const maskPhone = (p: string) =>
    p.length > 4 ? p.slice(0, -4).replace(/\d/g, "*") + p.slice(-4) : p;

  const sendOtp = (m: VerifyMethod) => {
    setMethod(m);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setOtpStep("enter");
    setCountdown(60);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (val: string, i: number) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...otp];
    updated[i] = val.slice(-1);
    setOtp(updated);
    setError("");
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const verifyOtp = () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setOtpStep("success");
  };

  const destination = method === "email" ? maskEmail(email) : maskPhone(phone);
  const isComplete = otp.every(d => d !== "");

  /* ─── CHOOSE METHOD ─── */
  if (otpStep === "choose") {
    return (
      <div className="w-full max-w-lg">
        <p className="text-sm font-semibold text-gray-400 mb-2 tracking-widest uppercase text-center">Step 3 of 3</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1 text-center">Verify your account</h1>
        <p className="text-sm text-gray-500 text-center mb-5">Choose how you'd like to receive your one-time code</p>
        <ProgressBar step={3} />

        <div className="mt-10 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Select verification method</p>

          <div className="space-y-3">
            {/* Email */}
            <button onClick={() => setMethod("email")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                ${method === "email" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${method === "email" ? "bg-blue-600" : "bg-gray-100"}`}>
                <Mail size={18} className={method === "email" ? "text-white" : "text-gray-500"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${method === "email" ? "text-blue-700" : "text-gray-800"}`}>Email address</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{maskEmail(email) || "—"}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                ${method === "email" ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                {method === "email" && <Check size={11} className="text-white" />}
              </div>
            </button>

            {/* Phone */}
            <button onClick={() => setMethod("phone")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                ${method === "phone" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${method === "phone" ? "bg-blue-600" : "bg-gray-100"}`}>
                <Phone size={18} className={method === "phone" ? "text-white" : "text-gray-500"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${method === "phone" ? "text-blue-700" : "text-gray-800"}`}>Phone number</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{maskPhone(phone) || "—"}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                ${method === "phone" ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                {method === "phone" && <Check size={11} className="text-white" />}
              </div>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={() => method && sendOtp(method)} disabled={!method}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm transition-all
                ${method ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200" : "bg-blue-300 cursor-not-allowed"}`}>
              Send Code <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── ENTER OTP ─── */
  if (otpStep === "enter") {
    return (
      <div className="w-full max-w-lg">
        <p className="text-sm font-semibold text-gray-400 mb-2 tracking-widest uppercase text-center">Step 3 of 3</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1 text-center">Enter your code</h1>
        <p className="text-sm text-gray-500 text-center mb-5">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-gray-700">{destination}</span>
        </p>
        <ProgressBar step={3} />

        <div className="mt-10 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
              {method === "email"
                ? <Mail size={28} className="text-blue-600" />
                : <Phone size={28} className="text-blue-600" />}
            </div>
          </div>

          {/* OTP boxes */}
          <div className="flex justify-center gap-3 mb-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(e.target.value, i)}
                onKeyDown={e => handleOtpKey(e, i)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none
                  ${digit
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-800"}
                  focus:border-blue-500 focus:bg-blue-50`}
              />
            ))}
          </div>

          {/* Error */}
          {error && <p className="text-center text-xs text-red-500 mt-2 font-medium">{error}</p>}

          {/* Resend */}
          <div className="flex items-center justify-center mt-5 mb-1">
            {countdown > 0 ? (
              <p className="text-xs text-gray-400">
                Resend code in <span className="font-semibold text-gray-600">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={() => { setOtp(["", "", "", "", "", ""]); setError(""); setCountdown(60); setTimeout(() => inputRefs.current[0]?.focus(), 100); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <RefreshCw size={13} /> Resend code
              </button>
            )}
          </div>

          {/* Change method */}
          <p className="text-center text-xs text-gray-400 mt-2">
            Wrong destination?{" "}
            <button
              onClick={() => { setOtpStep("choose"); setMethod(null); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="text-blue-600 font-semibold hover:underline"
            >
              Change method
            </button>
          </p>

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              onClick={() => { setOtpStep("choose"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={verifyOtp}
              disabled={!isComplete}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm transition-all
                ${isComplete ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200" : "bg-blue-300 cursor-not-allowed"}`}
            >
              <ShieldCheck size={16} /> Verify Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── SUCCESS ─── */
  return (
    <div className="w-full max-w-lg text-center">
      <ProgressBar step={3} />

      <div className="mt-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center">
        {/* Animated check */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
              <Check size={34} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          {/* Sparkle rings */}
          <div className="absolute inset-0 rounded-full border-2 border-green-200 opacity-50 scale-110" />
          <div className="absolute inset-0 rounded-full border border-green-100 opacity-30 scale-125" />
        </div>

        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          <ShieldCheck size={13} /> Verified via {method === "email" ? "email" : "phone"}
        </span>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">You're all set! 🎉</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
          Your account has been successfully verified. Welcome to <span className="font-semibold text-gray-800">AthleteQ</span> — let's get started.
        </p>

        {/* Details card */}
        <div className="w-full mt-7 bg-gray-50 rounded-xl border border-gray-100 px-5 py-4 text-left space-y-2.5">
          <div className="flex items-center gap-3">
            {method === "email"
              ? <Mail size={15} className="text-blue-500 shrink-0" />
              : <Phone size={15} className="text-blue-500 shrink-0" />}
            <span className="text-xs text-gray-500">Verified {method === "email" ? "email" : "phone"}:</span>
            <span className="text-xs font-semibold text-gray-800 ml-auto">
              {method === "email" ? maskEmail(email) : maskPhone(phone)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={15} className="text-green-500 shrink-0" />
            <span className="text-xs text-gray-500">Account status:</span>
            <span className="text-xs font-semibold text-green-600 ml-auto">Active &amp; Verified</span>
          </div>
        </div>

        <button className="mt-7 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-200">
          Go to Dashboard <ChevronRight size={16} />
        </button>

        <p className="text-xs text-gray-400 mt-4">
          A confirmation has been sent to{" "}
          <span className="text-gray-600 font-medium">{method === "email" ? maskEmail(email) : maskPhone(phone)}</span>
        </p>
      </div>
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
