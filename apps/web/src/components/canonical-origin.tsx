"use client";

import { useEffect } from "react";
import { canonicalApplicationUrl } from "../lib/canonical-origin";

export function CanonicalOrigin({ publicOrigin }: { publicOrigin: string }) {
  useEffect(() => {
    const target = canonicalApplicationUrl(publicOrigin, window.location.href);
    if (target) window.location.replace(target);
  }, [publicOrigin]);
  return null;
}
