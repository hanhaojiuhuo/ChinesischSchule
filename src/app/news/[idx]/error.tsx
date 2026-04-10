"use client";

import PageError from "@/components/PageError";

export default function NewsDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError error={error} reset={reset} label="NewsDetail" />;
}
