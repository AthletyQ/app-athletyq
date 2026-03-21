"use client";

import CoachListPage from "@/components/coach/CoachListPage";

/**
 * Coaches page for Athletes.
 * Now uses the shared CoachListPage component to ensure consistency
 * across all user roles.
 */
export default function CoachesPage() {
  return <CoachListPage />;
}
