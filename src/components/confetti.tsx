'use client';

import { useEffect, useState } from 'react';

// This is a symbolic component. We are using pure CSS for the effect.
// The actual animation is defined in globals.css
export default function Confetti() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }
  
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="confetti"></div>
      ))}
    </div>
  );
}
