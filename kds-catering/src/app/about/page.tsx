"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Users, Heart, Clock, ArrowRight } from "lucide-react";
import { CTASection } from "@/components/sections";

const stats = [
  { icon: Clock, value: "15+", label: "Years of Experience" },
  { icon: Users, value: "500+", label: "Events Catered" },
  { icon: Heart, value: "50k+", label: "Happy Guests" },
  { icon: Award, value: "5.0", label: "Google Rating" },
];

const values = [
  {
    title: "Authenticity",
    description:
      "We stay true to traditional Southern recipes passed down through generations, using time-honored techniques that bring out the soul in every dish.",
  },
  {
    title: "Quality",
    description:
      "We source the freshest, highest-quality ingredients. From locally-grown produce to premium meats, quality is never compromised.",
  },
  {
    title: "Hospitality",
    description:
      "Southern hospitality isn't just a saying—it's how we treat every client. We make you feel like family from the first call to the last bite.",
  },
  {
    title: "Community",
    description:
      "Food brings people together. We're proud to be part of countless family gatherings, celebrations, and community events across NYC.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-cream">
        <div className="container-custom">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-orange font-montserrat font-semibold uppercase tracking-wider text-sm"
            >
              Our Story
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-brown mt-2 mb-6"
            >
              A Passion for <span className="text-orange">Comfort Food</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-brown/70 leading-relaxed"
            >
              What started as a grandmother&apos;s kitchen has grown into NYC&apos;s
              premier soul food catering service. We bring warmth, flavor, and
              love to every event we serve.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative h-[500px] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Chef preparing food"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-orange rounded-2xl -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-brown">
                From Grandma&apos;s Kitchen to Your Table
              </h2>
              <div className="w-16 h-1 bg-gold" />
              <div className="space-y-4 text-brown/70 leading-relaxed">
                <p>
                  KD&apos;s Comfort Food was born from a simple truth: the best
                  meals are made with love. Growing up in the South, our
                  founder learned that food isn&apos;t just sustenance—it&apos;s how we
                  show care, build community, and celebrate life&apos;s moments.
                </p>
                <p>
                  After moving to New York City, KD noticed something missing:
                  authentic soul food that reminded people of home. In 2010,
                  with grandmother&apos;s recipes in hand and a passion for
                  hospitality, KD&apos;s Comfort Food was born.
                </p>
                <p>
                  What started as catering for friends and family quickly grew
                  through word of mouth. Today, we&apos;re proud to serve
                  hundreds of events each year, from intimate family gatherings
                  to corporate celebrations, always staying true to our roots.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-brown">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center text-white"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-gold" />
                  <span className="block text-4xl font-playfair font-bold text-orange">
                    {stat.value}
                  </span>
                  <span className="text-sm text-white/70 font-montserrat">
                    {stat.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chef/Team Section */}
      <section className="py-20 bg-cream">
        <div className="container-custom">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-heading"
            >
              Meet the Team
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              className="gold-divider"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Chef KD",
                role: "Founder & Executive Chef",
                image: "photo-1577219491135-ce391730fb2c",
              },
              {
                name: "Marcus Johnson",
                role: "Head Chef",
                image: "photo-1581299894007-aaa50297cf16",
              },
              {
                name: "Tanya Williams",
                role: "Catering Director",
                image: "photo-1594744803329-e58b31de8bf5",
              },
            ].map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative h-64 w-64 mx-auto rounded-full overflow-hidden mb-4">
                  <Image
                    src={`https://images.unsplash.com/${member.image}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-playfair font-semibold text-xl text-brown">
                  {member.name}
                </h3>
                <p className="text-orange font-montserrat text-sm">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-orange font-montserrat font-semibold uppercase tracking-wider text-sm"
            >
              What We Believe
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-heading mt-2"
            >
              Our Values
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              className="gold-divider"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-cream rounded-xl p-6"
              >
                <h3 className="font-playfair font-semibold text-xl text-orange mb-2">
                  {value.title}
                </h3>
                <p className="text-brown/70">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Press/Awards Section */}
      <section className="py-16 bg-cream border-t border-brown/10">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h3 className="font-montserrat font-semibold text-sm uppercase tracking-wider text-brown/50">
              As Featured In
            </h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
            {["NY Times", "Food & Wine", "Eater NY", "Time Out", "Zagat"].map(
              (pub) => (
                <span
                  key={pub}
                  className="font-playfair text-2xl text-brown/70"
                >
                  {pub}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection />
    </>
  );
}
