"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/constants";
import { CTASection } from "@/components/sections";
import { cn } from "@/lib/utils";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-cream">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-orange font-montserrat font-semibold uppercase tracking-wider text-sm"
            >
              Got Questions?
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-brown mt-2 mb-6"
            >
              Frequently Asked <span className="text-orange">Questions</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-brown/70 leading-relaxed"
            >
              Find answers to common questions about our catering services,
              booking process, and more. Still have questions? We&apos;re here
              to help.
            </motion.p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-brown/10 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between p-6 text-left bg-cream hover:bg-cream/80 transition-colors"
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="font-playfair font-semibold text-lg text-brown pr-4">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-orange flex-shrink-0 transition-transform duration-300",
                        openIndex === index ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 bg-cream">
                          <p className="text-brown/70 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-cream">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 text-orange mx-auto mb-4" />
            <h2 className="text-2xl font-playfair font-bold text-brown mb-4">
              Still Have Questions?
            </h2>
            <p className="text-brown/70 mb-6">
              Can&apos;t find what you&apos;re looking for? Our team is happy
              to answer any questions you might have about our catering
              services.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Contact Us
              </Link>
              <a
                href="tel:(555) 123-4567"
                className="btn-secondary"
              >
                Call (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection />
    </>
  );
}
