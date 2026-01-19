"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FormData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  guestCount: string;
  eventType: string;
  budget: string;
  dietaryNotes: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    guestCount: "",
    eventType: "",
    budget: "",
    dietaryNotes: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.eventDate) {
      newErrors.eventDate = "Event date is required";
    }
    if (!formData.guestCount) {
      newErrors.guestCount = "Guest count is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-cream pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center p-8"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-playfair font-bold text-brown mb-4">
            Thank You!
          </h2>
          <p className="text-brown/70 mb-6">
            We&apos;ve received your inquiry and will be in touch within 24-48
            hours. We can&apos;t wait to help make your event special!
          </p>
          <a href="/" className="btn-primary">
            Return Home
          </a>
        </motion.div>
      </section>
    );
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
              Get In Touch
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-brown mt-2 mb-6"
            >
              Book Your <span className="text-orange">Event</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-brown/70 leading-relaxed"
            >
              Ready to bring delicious comfort food to your next event? Fill out
              the form below and we&apos;ll get back to you within 24-48 hours.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-playfair font-bold text-brown mb-6">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <a
                    href={`tel:${SITE_CONFIG.phone}`}
                    className="flex items-center space-x-4 text-brown/70 hover:text-orange transition-colors"
                  >
                    <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-sm text-brown/50">Phone</p>
                      <p className="font-medium text-brown">{SITE_CONFIG.phone}</p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${SITE_CONFIG.email}`}
                    className="flex items-center space-x-4 text-brown/70 hover:text-orange transition-colors"
                  >
                    <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-sm text-brown/50">Email</p>
                      <p className="font-medium text-brown">{SITE_CONFIG.email}</p>
                    </div>
                  </a>

                  <div className="flex items-start space-x-4 text-brown/70">
                    <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-sm text-brown/50">Address</p>
                      <p className="font-medium text-brown">{SITE_CONFIG.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-brown/70">
                    <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-sm text-brown/50">Business Hours</p>
                      <p className="font-medium text-brown">Mon-Fri: 9am - 6pm</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="font-montserrat font-semibold text-brown mb-4">
                  Follow Us
                </h3>
                <div className="flex space-x-4">
                  <a
                    href={SITE_CONFIG.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-cream rounded-full flex items-center justify-center text-brown hover:bg-orange hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href={SITE_CONFIG.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-cream rounded-full flex items-center justify-center text-brown hover:bg-orange hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href={SITE_CONFIG.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-cream rounded-full flex items-center justify-center text-brown hover:bg-orange hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-cream rounded-xl p-4 h-48 flex items-center justify-center">
                <p className="text-brown/50 text-sm font-montserrat">
                  Google Maps Integration
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="bg-cream rounded-2xl p-8">
                <h2 className="text-2xl font-playfair font-bold text-brown mb-6">
                  Request a Quote
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors",
                          errors.name ? "border-red-500" : "border-brown/20"
                        )}
                        placeholder="John Smith"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors",
                          errors.email ? "border-red-500" : "border-brown/20"
                        )}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors",
                          errors.phone ? "border-red-500" : "border-brown/20"
                        )}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>

                    {/* Event Date */}
                    <div>
                      <label
                        htmlFor="eventDate"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Event Date *
                      </label>
                      <input
                        type="date"
                        id="eventDate"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleChange}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors",
                          errors.eventDate ? "border-red-500" : "border-brown/20"
                        )}
                      />
                      {errors.eventDate && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.eventDate}
                        </p>
                      )}
                    </div>

                    {/* Guest Count */}
                    <div>
                      <label
                        htmlFor="guestCount"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Expected Guest Count *
                      </label>
                      <select
                        id="guestCount"
                        name="guestCount"
                        value={formData.guestCount}
                        onChange={handleChange}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors",
                          errors.guestCount ? "border-red-500" : "border-brown/20"
                        )}
                      >
                        <option value="">Select guest count</option>
                        <option value="10-25">10-25 guests</option>
                        <option value="26-50">26-50 guests</option>
                        <option value="51-100">51-100 guests</option>
                        <option value="101-200">101-200 guests</option>
                        <option value="200+">200+ guests</option>
                      </select>
                      {errors.guestCount && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.guestCount}
                        </p>
                      )}
                    </div>

                    {/* Event Type */}
                    <div>
                      <label
                        htmlFor="eventType"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Event Type
                      </label>
                      <select
                        id="eventType"
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-brown/20 bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors"
                      >
                        <option value="">Select event type</option>
                        <option value="wedding">Wedding</option>
                        <option value="corporate">Corporate Event</option>
                        <option value="private-party">Private Party</option>
                        <option value="drop-off">Drop-Off Catering</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label
                        htmlFor="budget"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Estimated Budget
                      </label>
                      <select
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-brown/20 bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors"
                      >
                        <option value="">Select budget range</option>
                        <option value="under-1000">Under $1,000</option>
                        <option value="1000-2500">$1,000 - $2,500</option>
                        <option value="2500-5000">$2,500 - $5,000</option>
                        <option value="5000-10000">$5,000 - $10,000</option>
                        <option value="10000+">$10,000+</option>
                      </select>
                    </div>

                    {/* Dietary Notes */}
                    <div>
                      <label
                        htmlFor="dietaryNotes"
                        className="block text-sm font-montserrat font-medium text-brown mb-2"
                      >
                        Dietary Restrictions/Notes
                      </label>
                      <input
                        type="text"
                        id="dietaryNotes"
                        name="dietaryNotes"
                        value={formData.dietaryNotes}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-brown/20 bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors"
                        placeholder="e.g., 5 vegetarian guests, nut allergy"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-montserrat font-medium text-brown mb-2"
                    >
                      Additional Details
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-brown/20 bg-white focus:outline-none focus:ring-2 focus:ring-orange transition-colors resize-none"
                      placeholder="Tell us more about your event, any specific menu requests, or questions you have..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full btn-primary py-4 flex items-center justify-center",
                      isSubmitting && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Inquiry
                      </>
                    )}
                  </button>

                  <p className="text-center text-brown/50 text-sm">
                    We typically respond within 24-48 hours.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
