"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Phone } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export default function CTASection() {
  return (
    <section className="py-20 bg-orange relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container-custom relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-white mb-4"
          >
            Ready to Create Something Special?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-white/90 mb-8"
          >
            Let us make your next event unforgettable with our delicious
            Southern comfort cuisine. Get in touch today for a free consultation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange font-montserrat font-semibold rounded-lg transition-all duration-300 hover:bg-cream hover:shadow-lg group"
            >
              <Calendar className="w-5 h-5 mr-2" />
              <span>Book Your Event</span>
            </Link>
            <a
              href={`tel:${SITE_CONFIG.phone}`}
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-montserrat font-semibold rounded-lg transition-all duration-300 hover:bg-white/10"
            >
              <Phone className="w-5 h-5 mr-2" />
              <span>Call {SITE_CONFIG.phone}</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
