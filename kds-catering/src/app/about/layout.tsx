import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about KD's Comfort Food - our story, our team, and our commitment to authentic Southern comfort cuisine catering in NYC.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
