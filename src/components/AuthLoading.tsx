import React from 'react';
import { Skull } from 'lucide-react';

export function AuthLoading() {
  return (
    <div className="min-h-screen w-full bg-[#f4f4f0] dark:bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
      <Skull size={40} strokeWidth={2.5} className="animate-pulse" />
      <p className="font-bold uppercase tracking-widest text-sm">Loading…</p>
    </div>
  );
}
