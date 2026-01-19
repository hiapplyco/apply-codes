import { Metadata } from "next";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Drop-Off Catering",
  description:
    "Quality catering delivered right to your door. KD's Comfort Food drop-off catering is perfect for casual gatherings and office lunches in NYC.",
};

export default function DropOffPage() {
  return (
    <ServicePageTemplate
      title="Drop-Off Catering"
      description="Quality catering delivered right to your door, ready to serve. Perfect for casual gatherings and office lunches—we prepare everything fresh, deliver it hot, and set it up beautifully."
      heroImage="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
      features={[
        "Ready-to-serve setup",
        "Eco-friendly packaging",
        "Competitive pricing",
        "Quick turnaround (24-48 hours)",
        "Reheating instructions included",
        "Serving utensils provided",
        "Dietary labeling on all items",
        "Contactless delivery available",
        "Easy online ordering",
      ]}
      whyChooseUs={[
        {
          title: "Convenience",
          description:
            "Everything arrives ready to serve. Just open and enjoy—no setup stress.",
        },
        {
          title: "Quality Unchanged",
          description:
            "Same delicious recipes as our full-service options, just delivered differently.",
        },
        {
          title: "Affordable",
          description:
            "Get premium catering at a fraction of the cost without service staff fees.",
        },
        {
          title: "Fast Turnaround",
          description:
            "Order with as little as 24 hours notice for most menu items.",
        },
        {
          title: "Eco-Friendly",
          description:
            "Sustainable packaging options that are good for the planet.",
        },
        {
          title: "Perfect Portions",
          description:
            "Portioned correctly for your guest count with minimal waste.",
        },
      ]}
      sampleMenu={[
        {
          category: "Popular Combos",
          items: [
            "Fried Chicken Feast",
            "BBQ Trio Package",
            "Vegetarian Spread",
            "Soul Food Sampler",
          ],
        },
        {
          category: "À La Carte Trays",
          items: [
            "Mac & Cheese (serves 10)",
            "Collard Greens (serves 10)",
            "Candied Yams (serves 10)",
            "Cornbread (2 dozen)",
          ],
        },
        {
          category: "Add-Ons",
          items: [
            "Dessert Platter",
            "Beverage Package",
            "Fresh Salad",
            "Bread Basket",
          ],
        },
      ]}
    />
  );
}
