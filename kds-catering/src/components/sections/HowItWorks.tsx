"use client";

import { motion } from "framer-motion";
import { MessageCircle, ClipboardList, PartyPopper } from "lucide-react";
import { HOW_IT_WORKS } from "@/lib/constants";

const stepIcons = [MessageCircle, ClipboardList, PartyPopper];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-brown text-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container-custom relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gold font-montserrat font-semibold uppercase tracking-wider text-sm"
          >
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-playfair font-bold mt-2 mb-4"
          >
            How It Works
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-24 h-1 bg-gold mx-auto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {HOW_IT_WORKS.map((item, index) => {
            const Icon = stepIcons[index];
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Connector Line */}
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gold/30">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gold rounded-full" />
                  </div>
                )}

                {/* Step Number */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-24 h-24 bg-orange/20 rounded-full flex items-center justify-center">
                    <div className="w-20 h-20 bg-orange rounded-full flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-brown font-montserrat font-bold text-sm">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-2xl font-playfair font-semibold mb-3 text-gold">
                  {item.title}
                </h3>
                <p className="text-white/70 leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
