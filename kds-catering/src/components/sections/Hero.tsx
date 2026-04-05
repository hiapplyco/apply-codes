"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brown/90 via-brown/70 to-brown/50" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="container-custom relative z-10 pt-24 pb-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
          >
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-white/90 text-sm font-montserrat">
              NYC&apos;s Premier Soul Food Caterer
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white leading-tight mb-6"
          >
            Soul Food That Brings{" "}
            <span className="text-orange">People Together</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/80 font-opensans leading-relaxed mb-8 max-w-2xl"
          >
            From intimate gatherings to grand celebrations, we bring the warmth
            of Southern comfort cuisine to your special moments. Premium
            catering for weddings, corporate events, and private parties.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/contact"
              className="btn-primary group"
            >
              <span>Book Your Event</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-montserrat font-semibold rounded-lg transition-all duration-300 hover:bg-white/20"
            >
              Explore Our Menu
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex items-center space-x-8"
          >
            <div className="text-white">
              <span className="text-3xl font-playfair font-bold text-orange">500+</span>
              <span className="block text-sm text-white/70 font-montserrat">
                Events Catered
              </span>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-white">
              <span className="text-3xl font-playfair font-bold text-orange">15+</span>
              <span className="block text-sm text-white/70 font-montserrat">
                Years Experience
              </span>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-white hidden sm:block">
              <span className="text-3xl font-playfair font-bold text-orange">5.0</span>
              <span className="block text-sm text-white/70 font-montserrat">
                Google Rating
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-3 bg-orange rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
