"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useNavigate() {
  const router = useRouter();
  return useCallback((to: string) => router.push(to), [router]);
}
