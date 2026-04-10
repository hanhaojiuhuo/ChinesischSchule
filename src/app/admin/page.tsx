"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { AdminPageProvider, useAdminPage } from "@/contexts/AdminPageContext";
import LoginScreen from "@/components/admin/LoginScreen";

/* Dynamic imports for admin components — keep them out of the main bundle */
const AdminDashboard = dynamic(
  () => import("@/components/admin/AdminDashboard"),
  { loading: () => <div className="min-h-screen flex items-center justify-center">⏳ Loading dashboard…</div> },
);
const ResetConfirmDialog = dynamic(
  () => import("@/components/admin/ResetConfirmDialog"),
);

/* ─── Admin Page ────────────────────────────────────────────── */
export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">⏳</div>}>
      <AdminPageProvider>
        <AdminPageContent />
      </AdminPageProvider>
    </Suspense>
  );
}

function AdminPageContent() {
  const { auth, resetDialog } = useAdminPage();

  if (!auth.isAdmin) {
    return <LoginScreen />;
  }

  return (
    <>
      <AdminDashboard />
      <ResetConfirmDialog
        open={resetDialog.showResetDialog}
        onConfirm={resetDialog.confirmReset}
        onCancel={() => resetDialog.setShowResetDialog(false)}
      />
    </>
  );
}
