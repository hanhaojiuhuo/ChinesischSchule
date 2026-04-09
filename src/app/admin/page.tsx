"use client";

import { Suspense } from "react";
import { AdminPageProvider, useAdminPage } from "@/contexts/AdminPageContext";
import LoginScreen from "@/components/admin/LoginScreen";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ResetConfirmDialog from "@/components/admin/ResetConfirmDialog";

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
