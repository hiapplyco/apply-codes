"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { CTASection } from "@/components/sections";

interface ServicePageTemplateProps {
  title: string;
  description: string;
  heroImage: string;
  features: string[];
  whyChooseUs: {
    title: string;
    description: string;
  }[];
  sampleMenu?: {
    category: string;
    items: string[];
  }[];
}

export default function ServicePageTemplate({
  title,
  description,
  heroImage,
  features,
  whyChooseUs,
  sampleMenu,
}: ServicePageTemplateProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brown/90 via-brown/70 to-brown/40" />
        </div>

        <div className="container-custom relative z-10 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <Link
              href="/services"
              className="inline-flex items-center text-white/70 hover:text-white mb-4 text-sm font-montserrat transition-colors"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              All Services
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white mb-6">
              {title}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-playfair font-bold text-brown mb-4">
                What&apos;s Included
              </h2>
              <div className="w-16 h-1 bg-gold mb-6" />
              <p className="text-brown/70 mb-8">
                Every {title.toLowerCase()} package comes with our commitment to
                excellence and attention to detail.
              </p>
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-orange/10 flex items-center justify-center mr-3 mt-0.5">
                      <Check className="w-4 h-4 text-orange" />
                    </span>
                    <span className="text-brown/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-xl overflow-hidden ${
                    i === 1 || i === 4 ? "h-48" : "h-64"
                  }`}
                >
                  <Image
                    src={`https://images.unsplash.com/photo-${
                      i === 1
                        ? "1555244162-803834f70033"
                        : i === 2
                        ? "1414235077428-338989a2e8c0"
                        : i === 3
                        ? "1467003909585-2f8a72700288"
                        : "1529543544277-00788bf8ce00"
                    }?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`}
                    alt={`${title} catering`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-cream">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">
              Why Choose Us for Your {title}
            </h2>
            <div className="gold-divider" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h3 className="font-playfair font-semibold text-xl text-orange mb-2">
                  {item.title}
                </h3>
                <p className="text-brown/70 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Menu */}
      {sampleMenu && (
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <span className="text-orange font-montserrat font-semibold uppercase tracking-wider text-sm">
                Preview
              </span>
              <h2 className="section-heading mt-2">Sample Menu</h2>
              <div className="gold-divider" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {sampleMenu.map((category) => (
                <div key={category.category}>
                  <h3 className="font-playfair font-semibold text-xl text-brown mb-4 pb-2 border-b border-gold">
                    {category.category}
                  </h3>
                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li key={item} className="text-brown/70">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/menu" className="btn-secondary">
                View Full Menu
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <CTASection />
    </>
  );
}
