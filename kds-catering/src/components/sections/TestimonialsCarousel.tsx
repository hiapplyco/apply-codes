"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/constants";

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
    );
  };

  return (
    <section className="py-20 bg-cream">
      <div className="container-custom">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-orange font-montserrat font-semibold uppercase tracking-wider text-sm"
          >
            What People Say
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-heading mt-2"
          >
            Client Testimonials
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="gold-divider"
          />
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Carousel */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-8 md:p-12 relative"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 left-6 md:top-8 md:left-8">
                  <Quote className="w-12 h-12 text-orange/20" />
                </div>

                <div className="text-center pt-8">
                  {/* Rating */}
                  <div className="flex justify-center space-x-1 mb-6">
                    {[...Array(TESTIMONIALS[currentIndex].rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-gold fill-gold"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg md:text-xl text-brown/80 font-opensans leading-relaxed mb-8 italic">
                    &ldquo;{TESTIMONIALS[currentIndex].quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div>
                    <p className="font-playfair font-semibold text-brown text-lg">
                      {TESTIMONIALS[currentIndex].name}
                    </p>
                    <p className="text-orange font-montserrat text-sm">
                      {TESTIMONIALS[currentIndex].event}
                    </p>
                    <p className="text-brown/50 text-xs mt-1">
                      {TESTIMONIALS[currentIndex].date}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={prev}
              className="p-3 rounded-full bg-white shadow-md hover:bg-orange hover:text-white transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex space-x-2">
              {TESTIMONIALS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === currentIndex ? "bg-orange" : "bg-brown/20"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-3 rounded-full bg-white shadow-md hover:bg-orange hover:text-white transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
