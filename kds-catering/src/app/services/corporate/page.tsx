import { Metadata } from "next";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Corporate Event Catering",
  description:
    "Impress clients and energize your team with KD's Comfort Food corporate catering. Professional soul food catering for business events in NYC.",
};

export default function CorporatePage() {
  return (
    <ServicePageTemplate
      title="Corporate Events"
      description="Impress clients and energize your team with premium soul-food catering. From board meetings to company celebrations, we deliver exceptional food and service that reflects your company's standards."
      heroImage="https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
      features={[
        "Corporate account management",
        "Flexible scheduling for busy offices",
        "Volume pricing for regular orders",
        "Professional presentation and setup",
        "On-time delivery guaranteed",
        "Branded packaging available",
        "Individual and family-style options",
        "Dietary labeling included",
        "Invoice and billing options",
      ]}
      whyChooseUs={[
        {
          title: "Reliability",
          description:
            "We understand corporate timelines. Your food arrives when promised, every time.",
        },
        {
          title: "Professional Service",
          description:
            "Our staff is trained in corporate hospitality and maintains a professional demeanor.",
        },
        {
          title: "Scalability",
          description:
            "From 10-person lunches to 500-guest galas, we handle events of all sizes.",
        },
        {
          title: "Account Management",
          description:
            "Dedicated account managers for frequent corporate clients with streamlined ordering.",
        },
        {
          title: "Dietary Options",
          description:
            "Clear labeling for allergens and dietary restrictions keeps all guests safe.",
        },
        {
          title: "Budget Flexibility",
          description:
            "Various package tiers to fit different corporate budgets without sacrificing quality.",
        },
      ]}
      sampleMenu={[
        {
          category: "Breakfast",
          items: [
            "Southern Biscuit Bar",
            "Eggs & Grits Station",
            "Fresh Fruit Display",
            "Breakfast Meats",
          ],
        },
        {
          category: "Lunch Entrées",
          items: [
            "BBQ Chicken",
            "Pulled Pork Sliders",
            "Grilled Salmon",
            "Vegetable Jambalaya",
          ],
        },
        {
          category: "Sides & Salads",
          items: [
            "Classic Cole Slaw",
            "Potato Salad",
            "Green Bean Casserole",
            "Fresh Garden Salad",
          ],
        },
      ]}
    />
  );
}
