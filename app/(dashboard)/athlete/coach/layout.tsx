export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased">
      {children}
    </div>
  );
}