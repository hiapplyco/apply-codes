// Site Configuration
export const SITE_CONFIG = {
  name: "KD's Comfort Food",
  tagline: "Catering Services",
  description:
    "Premium soul-food catering for weddings, corporate events, and private parties in NYC and the Tri-State area.",
  phone: "(555) 123-4567",
  email: "info@kdscomfortfood.com",
  address: "123 Main Street, New York, NY 10001",
  socialMedia: {
    instagram: "https://instagram.com/kdscomfortfood",
    facebook: "https://facebook.com/kdscomfortfood",
    twitter: "https://twitter.com/kdscomfortfood",
  },
};

// Navigation Links
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Weddings", href: "/services/weddings" },
      { label: "Corporate Events", href: "/services/corporate" },
      { label: "Private Parties", href: "/services/private-parties" },
      { label: "Drop-Off Catering", href: "/services/drop-off" },
    ],
  },
  { label: "Menu", href: "/menu" },
  { label: "Gallery", href: "/gallery" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

// Services Data
export const SERVICES = [
  {
    id: "weddings",
    title: "Weddings",
    shortDescription: "Make your special day unforgettable with our soul-food wedding catering.",
    description:
      "From intimate ceremonies to grand celebrations, we bring warmth and flavor to your wedding day. Our experienced team handles everything from menu planning to service, ensuring your guests experience the best of Southern comfort cuisine.",
    image: "/images/services/weddings.jpg",
    features: [
      "Custom menu planning",
      "Professional service staff",
      "Setup and cleanup included",
      "Tastings available",
      "Dietary accommodations",
    ],
  },
  {
    id: "corporate",
    title: "Corporate Events",
    shortDescription: "Impress clients and energize your team with premium catering.",
    description:
      "Elevate your business gatherings with our professional corporate catering services. Whether it's a board meeting, company celebration, or client appreciation event, we deliver exceptional food and service that reflects your company's standards.",
    image: "/images/services/corporate.jpg",
    features: [
      "Flexible scheduling",
      "Volume pricing available",
      "Professional presentation",
      "On-time delivery guaranteed",
      "Account management",
    ],
  },
  {
    id: "private-parties",
    title: "Private Parties",
    shortDescription: "Celebrate life's moments with food that brings people together.",
    description:
      "Birthday parties, anniversaries, family reunions, and more. We help you create memorable gatherings with delicious comfort food that your guests will rave about. Let us handle the cooking while you enjoy the celebration.",
    image: "/images/services/parties.jpg",
    features: [
      "Customizable menus",
      "Full-service or drop-off options",
      "Party planning assistance",
      "Special occasion packages",
      "Kid-friendly options",
    ],
  },
  {
    id: "drop-off",
    title: "Drop-Off Catering",
    shortDescription: "Quality catering delivered right to your door, ready to serve.",
    description:
      "Perfect for casual gatherings and office lunches. We prepare everything fresh, deliver it hot, and set it up beautifully so you can focus on your event. A convenient and affordable option without compromising on quality.",
    image: "/images/services/dropoff.jpg",
    features: [
      "Ready-to-serve setup",
      "Eco-friendly packaging",
      "Competitive pricing",
      "Quick turnaround",
      "Reheating instructions included",
    ],
  },
];

// Menu Categories
export const MENU_CATEGORIES = [
  { id: "appetizers", name: "Appetizers" },
  { id: "entrees", name: "Entrées" },
  { id: "sides", name: "Sides" },
  { id: "desserts", name: "Desserts" },
  { id: "beverages", name: "Beverages" },
];

// Dietary Filters
export const DIETARY_FILTERS = [
  { id: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
];

// Package Tiers
export const PACKAGE_TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    description: "Essential comfort food favorites",
    priceRange: "Starting at $35/person",
    features: [
      "2 entrées",
      "3 sides",
      "Bread service",
      "Disposable serviceware",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    description: "Elevated dining experience",
    priceRange: "Starting at $55/person",
    features: [
      "3 entrées",
      "4 sides",
      "Appetizer selection",
      "Dessert included",
      "Premium serviceware",
    ],
    popular: true,
  },
  {
    id: "gold",
    name: "Gold",
    description: "Ultimate celebration package",
    priceRange: "Starting at $85/person",
    features: [
      "4 entrées",
      "5 sides",
      "Premium appetizers",
      "Dessert bar",
      "Full service staff",
      "Custom menu consultation",
    ],
  },
];

// How It Works Steps
export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Reach Out",
    description:
      "Contact us with your event details. We'll discuss your vision, guest count, and preferences.",
  },
  {
    step: 2,
    title: "Plan Together",
    description:
      "We'll create a custom menu that fits your taste, budget, and dietary needs. Schedule a tasting if you'd like.",
  },
  {
    step: 3,
    title: "Enjoy Your Event",
    description:
      "Relax while we handle everything. From setup to service to cleanup, we've got you covered.",
  },
];

// Testimonials
export const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah & Michael Johnson",
    event: "Wedding Reception",
    quote:
      "KD's Comfort Food made our wedding day absolutely perfect. The food was incredible, and our guests are still talking about the mac and cheese! The team was professional, warm, and made us feel like family.",
    rating: 5,
    date: "October 2025",
  },
  {
    id: 2,
    name: "Jennifer Williams",
    event: "Corporate Luncheon",
    quote:
      "We've used KD's for multiple company events, and they never disappoint. The quality is consistent, the presentation is beautiful, and the service is impeccable. Our clients are always impressed.",
    rating: 5,
    date: "September 2025",
  },
  {
    id: 3,
    name: "The Patterson Family",
    event: "Family Reunion",
    quote:
      "Bringing our family together from across the country deserved special food. KD's delivered beyond our expectations. The collard greens and fried chicken took us right back to grandma's kitchen.",
    rating: 5,
    date: "August 2025",
  },
  {
    id: 4,
    name: "David Chen",
    event: "Birthday Party",
    quote:
      "I wanted something different for my 50th birthday, and KD's soul food was the perfect choice. The ribs were falling off the bone, and the cornbread was to die for. Best party food ever!",
    rating: 5,
    date: "November 2025",
  },
];

// FAQ Items
export const FAQ_ITEMS = [
  {
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 2-4 weeks in advance for smaller events and 2-3 months for weddings and large corporate events. However, we understand that last-minute events happen, so don't hesitate to reach out even with shorter notice—we'll do our best to accommodate you.",
  },
  {
    question: "Do you offer tastings before booking?",
    answer:
      "Yes! We offer complimentary tastings for wedding and large event bookings (50+ guests). For smaller events, tastings are available for a nominal fee that's credited toward your final invoice if you book with us.",
  },
  {
    question: "Can you accommodate dietary restrictions?",
    answer:
      "Absolutely. We have extensive experience with vegetarian, vegan, gluten-free, and allergy-friendly options. Just let us know your guests' needs, and we'll create delicious alternatives that everyone can enjoy.",
  },
  {
    question: "What's included in your catering packages?",
    answer:
      "Our packages include food preparation, delivery, setup, and serviceware. Full-service packages also include professional staff for serving and cleanup. We'll provide a detailed breakdown during your consultation.",
  },
  {
    question: "Do you cater outside NYC?",
    answer:
      "Yes! We serve the entire Tri-State area including Long Island, Westchester, Northern New Jersey, and parts of Connecticut. Travel fees may apply depending on location and event size.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "We require a 50% deposit to secure your date. Cancellations made 14+ days before the event receive a full deposit refund. Cancellations within 7-14 days receive a 50% refund. Unfortunately, we cannot offer refunds for cancellations within 7 days of the event.",
  },
  {
    question: "Do you provide staff for events?",
    answer:
      "Yes, our Silver and Gold packages include professional service staff. For Bronze packages or drop-off catering, staff can be added for an additional fee. Our team is trained in hospitality and will ensure your guests are well taken care of.",
  },
  {
    question: "How do I get a quote for my event?",
    answer:
      "Simply fill out our contact form or give us a call. We'll ask about your event date, guest count, service style, and menu preferences. We typically send detailed quotes within 24-48 hours.",
  },
];

// Value Propositions
export const VALUE_PROPOSITIONS = [
  {
    title: "Authentic Soul Food",
    description:
      "Traditional recipes passed down through generations, made with love and the finest ingredients.",
    icon: "heart",
  },
  {
    title: "Premium Quality",
    description:
      "Fresh, locally-sourced ingredients prepared by experienced chefs who take pride in every dish.",
    icon: "star",
  },
  {
    title: "Full Service",
    description:
      "From planning to cleanup, we handle every detail so you can focus on enjoying your event.",
    icon: "check",
  },
  {
    title: "Custom Menus",
    description:
      "Every event is unique. We work with you to create a menu that perfectly fits your vision and budget.",
    icon: "utensils",
  },
];
