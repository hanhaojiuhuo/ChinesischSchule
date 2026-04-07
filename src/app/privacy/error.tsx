"use client";

import PageError from "@/components/PageError";

export default function PrivacyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} label="Privacy" />;
}
