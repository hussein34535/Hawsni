'use client';

import { memo } from 'react';

const MeshBackground = memo(function MeshBackground() {
  return (
    <div className="hidden md:block fixed inset-0 -z-10 overflow-hidden bg-[#fafafa]">
      {/* Mesh Blobs */}
      <div
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#0E4435]/10 rounded-full blur-[120px]"
      />
      
      <div
        className="absolute bottom-0 right-0 w-[70%] h-[70%] bg-[#D4AF37]/5 rounded-full blur-[140px]"
      />

      <div
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-white rounded-full blur-[100px] opacity-60"
      />

      {/* Subtle Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03]" />
    </div>
  );
});

export default MeshBackground;
