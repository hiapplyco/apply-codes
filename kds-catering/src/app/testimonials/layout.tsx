import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "Read what our clients say about KD's Comfort Food catering services. Real reviews from weddings, corporate events, and private parties.",
};

export default function TestimonialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
