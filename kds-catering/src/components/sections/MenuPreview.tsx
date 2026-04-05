"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const featuredItems = [
  {
    name: "Southern Fried Chicken",
    description: "Crispy, golden perfection seasoned with our secret blend of spices",
    image: "photo-1626645738196-c2a7c87a8f58",
    category: "Entrées",
  },
  {
    name: "Creamy Mac & Cheese",
    description: "Three-cheese blend baked to bubbly, golden perfection",
    image: "photo-1543339494-b4cd4f7ba686",
    category: "Sides",
  },
  {
    name: "Collard Greens",
    description: "Slow-cooked with smoked turkey for authentic Southern flavor",
    image: "photo-1574484284002-952d92456975",
    category: "Sides",
  },
  {
    name: "Peach Cobbler",
    description: "Warm, cinnamon-spiced peaches with buttery biscuit topping",
    image: "photo-1464305795204-6f5bbfc7fb81",
    category: "Desserts",
  },
];

export default function MenuPreview() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-orange font-montserrat font-semibold uppercase tracking-wider text-sm"
          >
            Taste the Comfort
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-heading mt-2"
          >
            Featured Menu Items
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="gold-divider"
          />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="section-subheading"
          >
            A preview of our most loved dishes. Every bite tells a story of
            tradition, love, and quality ingredients.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative h-64 rounded-xl overflow-hidden mb-4">
                <Image
                  src={`https://images.unsplash.com/${item.image}?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80`}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brown/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute top-3 left-3 bg-orange text-white text-xs font-montserrat font-semibold px-3 py-1 rounded-full">
                  {item.category}
                </span>
              </div>
              <h3 className="font-playfair font-semibold text-lg text-brown mb-1">
                {item.name}
              </h3>
              <p className="text-sm text-brown/60">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link href="/menu" className="btn-primary group">
            <span>View Full Menu</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
