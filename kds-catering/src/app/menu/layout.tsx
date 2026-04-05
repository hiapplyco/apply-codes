import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Menu",
  description:
    "Browse KD's Comfort Food catering menu - authentic Southern soul food including fried chicken, mac & cheese, collard greens, and more.",
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
