import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "View photos of our delicious soul food dishes, beautiful event setups, and celebrations we've catered in NYC and the Tri-State area.",
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
