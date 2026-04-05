"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { CTASection } from "@/components/sections";
import { cn } from "@/lib/utils";

const galleryCategories = [
  { id: "all", name: "All" },
  { id: "food", name: "Food" },
  { id: "events", name: "Events" },
  { id: "setup", name: "Setup" },
  { id: "team", name: "Team" },
];

const galleryImages = [
  {
    id: 1,
    src: "photo-1555939594-58d7cb561ad1",
    alt: "Southern fried chicken platter",
    category: "food",
  },
  {
    id: 2,
    src: "photo-1519741497674-611481863552",
    alt: "Wedding reception dinner",
    category: "events",
  },
  {
    id: 3,
    src: "photo-1543339494-b4cd4f7ba686",
    alt: "Mac and cheese close-up",
    category: "food",
  },
  {
    id: 4,
    src: "photo-1414235077428-338989a2e8c0",
    alt: "Elegant table setup",
    category: "setup",
  },
  {
    id: 5,
    src: "photo-1530103862676-de8c9debad1d",
    alt: "Birthday celebration",
    category: "events",
  },
  {
    id: 6,
    src: "photo-1577219491135-ce391730fb2c",
    alt: "Chef preparing dishes",
    category: "team",
  },
  {
    id: 7,
    src: "photo-1504674900247-0877df9cc836",
    alt: "BBQ ribs plate",
    category: "food",
  },
  {
    id: 8,
    src: "photo-1511578314322-379afb476865",
    alt: "Corporate luncheon",
    category: "events",
  },
  {
    id: 9,
    src: "photo-1467003909585-2f8a72700288",
    alt: "Fresh ingredients",
    category: "food",
  },
  {
    id: 10,
    src: "photo-1555244162-803834f70033",
    alt: "Buffet setup",
    category: "setup",
  },
  {
    id: 11,
    src: "photo-1464305795204-6f5bbfc7fb81",
    alt: "Peach cobbler dessert",
    category: "food",
  },
  {
    id: 12,
    src: "photo-1581299894007-aaa50297cf16",
    alt: "Team in kitchen",
    category: "team",
  },
  {
    id: 13,
    src: "photo-1574484284002-952d92456975",
    alt: "Collard greens",
    category: "food",
  },
  {
    id: 14,
    src: "photo-1529543544277-00788bf8ce00",
    alt: "Outdoor event setup",
    category: "setup",
  },
  {
    id: 15,
    src: "photo-1556910103-1c02745aae4d",
    alt: "Chef plating",
    category: "team",
  },
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredImages = galleryImages.filter(
    (img) => activeCategory === "all" || img.category === activeCategory
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = "auto";
  };

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) =>
        prev !== null ? (prev + 1) % filteredImages.length : 0
      );
    }
  };

  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) =>
        prev !== null
          ? (prev - 1 + filteredImages.length) % filteredImages.length
          : 0
      );
    }
  };

  // Handle keyboard navigation
  if (typeof window !== "undefined") {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    if (lightboxIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
    }
  }

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
              See Our Work
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-brown mt-2 mb-6"
            >
              Photo <span className="text-orange">Gallery</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-brown/70 leading-relaxed"
            >
              Browse through our collection of mouthwatering dishes, beautiful
              event setups, and happy celebrations we&apos;ve been part of.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {galleryCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-6 py-2 rounded-full font-montserrat text-sm font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-orange text-white"
                    : "bg-cream text-brown hover:bg-orange/10"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
            >
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="break-inside-avoid"
                >
                  <button
                    onClick={() => openLightbox(index)}
                    className="relative w-full overflow-hidden rounded-xl group cursor-pointer"
                  >
                    <Image
                      src={`https://images.unsplash.com/${image.src}?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80`}
                      alt={image.alt}
                      width={600}
                      height={index % 3 === 0 ? 400 : index % 3 === 1 ? 500 : 350}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-brown/0 group-hover:bg-brown/40 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-montserrat font-medium">
                        View Image
                      </span>
                    </div>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Close lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl max-h-[80vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={`https://images.unsplash.com/${filteredImages[lightboxIndex].src}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=90`}
                alt={filteredImages[lightboxIndex].alt}
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto object-contain"
              />
              <p className="text-white/70 text-center mt-4 font-montserrat">
                {filteredImages[lightboxIndex].alt}
              </p>
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 font-montserrat text-sm">
              {lightboxIndex + 1} / {filteredImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <CTASection />
    </>
  );
}
