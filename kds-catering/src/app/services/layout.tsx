import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore KD's Comfort Food catering services - wedding catering, corporate events, private parties, and drop-off catering in NYC and the Tri-State area.",
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
