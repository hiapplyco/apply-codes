"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/constants";
import { CTASection } from "@/components/sections";

const serviceImages = [
  "photo-1519741497674-611481863552",
  "photo-1511578314322-379afb476865",
  "photo-1530103862676-de8c9debad1d",
  "photo-1504674900247-0877df9cc836",
];

export default function ServicesPage() {
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
              What We Offer
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-brown mt-2 mb-6"
            >
              Our Catering <span className="text-orange">Services</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-brown/70 leading-relaxed"
            >
              From intimate gatherings to grand celebrations, we have the
              perfect catering solution for every occasion. Each event is
              crafted with care, attention to detail, and a whole lot of soul.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="space-y-24">
            {SERVICES.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="relative h-[400px] rounded-2xl overflow-hidden">
                    <Image
                      src={`https://images.unsplash.com/${serviceImages[index]}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brown/40 to-transparent" />
                  </div>
                </div>

                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <h2 className="text-3xl md:text-4xl font-playfair font-bold text-brown mb-4">
                    {service.title}
                  </h2>
                  <div className="w-16 h-1 bg-gold mb-6" />
                  <p className="text-brown/70 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  <h4 className="font-montserrat font-semibold text-orange mb-3">
                    What&apos;s Included:
                  </h4>
                  <ul className="space-y-2 mb-8">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center text-brown/70"
                      >
                        <span className="w-2 h-2 bg-gold rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={`/services/${service.id}`}
                      className="btn-primary"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                    <Link href="/contact" className="btn-secondary">
                      Get a Quote
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection />
    </>
  );
}
