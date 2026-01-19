"use client";

import { motion } from "framer-motion";
import { Heart, Star, CheckCircle, Utensils } from "lucide-react";
import { VALUE_PROPOSITIONS } from "@/lib/constants";

const iconMap = {
  heart: Heart,
  star: Star,
  check: CheckCircle,
  utensils: Utensils,
};

export default function ValuePropositions() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-heading"
          >
            Why Choose <span className="text-orange">KD&apos;s</span>
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="gold-divider"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {VALUE_PROPOSITIONS.map((prop, index) => {
            const Icon = iconMap[prop.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-cream rounded-full mb-4 group-hover:bg-orange transition-colors duration-300">
                  <Icon className="w-8 h-8 text-orange group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-brown mb-2">
                  {prop.title}
                </h3>
                <p className="text-brown/70 text-sm leading-relaxed">
                  {prop.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
