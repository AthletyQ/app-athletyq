import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | AthletyQ",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
