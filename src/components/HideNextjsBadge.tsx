"use client";

import { useEffect } from 'react';

export default function HideNextjsBadge() {
  useEffect(() => {
    // Find and hide the Next.js badge element using DOM manipulation
    const badge = document.getElementById('__next-build-watcher');
    if (badge) {
      badge.style.display = 'none';
    }
  }, []);

  // This component doesn't render anything visible
  return null;
} 