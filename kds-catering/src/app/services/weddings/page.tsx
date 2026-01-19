import { Metadata } from "next";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Wedding Catering",
  description:
    "Make your special day unforgettable with KD's Comfort Food wedding catering. Authentic soul food for weddings in NYC and the Tri-State area.",
};

export default function WeddingsPage() {
  return (
    <ServicePageTemplate
      title="Wedding Catering"
      description="Make your special day unforgettable with our soul-food wedding catering. From intimate ceremonies to grand celebrations, we bring warmth, flavor, and love to your wedding celebration."
      heroImage="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
      features={[
        "Custom menu planning with personal chef consultation",
        "Complimentary tasting for couples",
        "Professional service staff in elegant attire",
        "Complete setup and breakdown included",
        "Dietary accommodations (vegetarian, vegan, gluten-free)",
        "Champagne toast coordination",
        "Late-night snack service available",
        "Wedding cake cutting service",
        "Coordination with your venue and planner",
      ]}
      whyChooseUs={[
        {
          title: "Personal Touch",
          description:
            "We treat every wedding like family. Your dedicated coordinator ensures every detail is perfect.",
        },
        {
          title: "Flexible Menus",
          description:
            "Mix and match dishes to create a menu that tells your unique love story through food.",
        },
        {
          title: "Experienced Team",
          description:
            "Over 200 weddings catered. We know how to handle the unexpected with grace.",
        },
        {
          title: "Beautiful Presentation",
          description:
            "Food that looks as stunning as it tastes. Instagram-worthy spreads guaranteed.",
        },
        {
          title: "Stress-Free Service",
          description:
            "From setup to cleanup, we handle everything so you can focus on your celebration.",
        },
        {
          title: "Guest Favorites",
          description:
            "Soul food that appeals to all ages and tastes. Your guests will remember this meal.",
        },
      ]}
      sampleMenu={[
        {
          category: "Appetizers",
          items: [
            "Crispy Crab Cakes with Remoulade",
            "Deviled Eggs with Bacon",
            "Shrimp & Grits Bites",
            "Mini Chicken & Waffles",
          ],
        },
        {
          category: "Entrées",
          items: [
            "Honey-Glazed Ham",
            "Herb-Roasted Chicken",
            "Slow-Smoked Brisket",
            "Blackened Catfish",
          ],
        },
        {
          category: "Sides",
          items: [
            "Truffle Mac & Cheese",
            "Collard Greens",
            "Sweet Potato Soufflé",
            "Buttery Cornbread",
          ],
        },
      ]}
    />
  );
}
