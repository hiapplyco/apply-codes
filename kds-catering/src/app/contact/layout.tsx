import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Book Now",
  description:
    "Contact KD's Comfort Food to book your catering event. Request a quote for weddings, corporate events, private parties in NYC and the Tri-State area.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
