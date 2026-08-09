import React, { useEffect, useRef, useCallback, useState } from 'react';

interface ScrollVideoProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

export default function ScrollVideo({ scrollContainerRef }: ScrollVideoProps) {
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track viewport size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const activeVideo = isMobile ? mobileVideoRef.current : desktopVideoRef.current;
      if (!activeVideo || !activeVideo.duration) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;

      if (scrollHeight <= 0) return;

      // Map scroll position (0 to 1) to video time
      const scrollFraction = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
      const targetTime = scrollFraction * activeVideo.duration;

      activeVideo.currentTime = targetTime;
    });
  }, [scrollContainerRef, isMobile]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial position
    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollContainerRef, handleScroll]);

  // When videos load, set initial frame
  const handleLoadedMetadata = useCallback(() => {
    handleScroll();
  }, [handleScroll]);

  return (
    <div className="scroll-video-container">
      {/* Mobile video */}
      <video
        ref={mobileVideoRef}
        className={`scroll-video ${isMobile ? 'scroll-video--active' : ''}`}
        src="/animate-mobile.mp4"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Desktop video */}
      <video
        ref={desktopVideoRef}
        className={`scroll-video ${!isMobile ? 'scroll-video--active' : ''}`}
        src="/animate-desktop.mp4"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Dark gradient overlay for readability */}
      <div className="scroll-video-overlay" />
    </div>
  );
}
