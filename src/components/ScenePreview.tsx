"use client";

import dynamic from "next/dynamic";

export const ScenePreview = dynamic(() => import("./Scene3D").then((module) => module.Scene3D), {
  ssr: false,
  loading: () => <p role="status" className="grid h-full place-items-center text-xs text-muted">Loading 3D preview…</p>,
});
