"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Calendar } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export default function MobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero section (roughly 400px)
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-cream-200 shadow-lg p-4"
        >
          <div className="flex items-center justify-center space-x-4">
            <a
              href={`tel:${SITE_CONFIG.phone}`}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-brown text-white rounded-lg font-montserrat font-medium text-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Call Now</span>
            </a>
            <Link
              href="/contact"
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-orange text-white rounded-lg font-montserrat font-medium text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Now</span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
