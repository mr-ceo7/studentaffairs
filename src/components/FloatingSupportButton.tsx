import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FloatingSupportButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show button after 1 second delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          href="mailto:clearinghouse@uonbi.ac.ke"
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed z-40 flex items-center justify-center w-12 h-12 rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-[0_8px_32px_rgba(29,78,216,0.3)] border border-blue-600/30 transition-colors bottom-24 right-4 md:bottom-8 md:right-8 group cursor-pointer"
          title="Email UoN Support Desk"
        >
          {/* Pulsing Outer Ring */}
          <div className="absolute inset-0 rounded-full bg-blue-700/30 animate-ping opacity-75 group-hover:hidden" />
          
          <Mail className="w-5 h-5 relative z-10" />

          {/* Tooltip Label */}
          <span className="absolute right-14 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-right-2">
            Support Desk
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
