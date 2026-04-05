import { Metadata } from "next";
import ServicePageTemplate from "@/components/ui/ServicePageTemplate";

export const metadata: Metadata = {
  title: "Private Party Catering",
  description:
    "Celebrate life's moments with KD's Comfort Food private party catering. Birthday parties, anniversaries, reunions, and more in NYC.",
};

export default function PrivatePartiesPage() {
  return (
    <ServicePageTemplate
      title="Private Parties"
      description="Celebrate life's moments with food that brings people together. Birthday parties, anniversaries, family reunions, and more—we help you create memorable gatherings with delicious comfort food."
      heroImage="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
      features={[
        "Customizable menus for any theme",
        "Full-service or drop-off options",
        "Party planning assistance",
        "Special occasion packages",
        "Kid-friendly menu options",
        "Themed food presentations",
        "Birthday cake coordination",
        "Music and entertainment coordination",
        "Venue recommendations available",
      ]}
      whyChooseUs={[
        {
          title: "Personal Celebrations",
          description:
            "We treat your party like our own family gathering—with love and attention to every detail.",
        },
        {
          title: "Crowd Pleasers",
          description:
            "Comfort food that appeals to all ages, from kids to grandparents.",
        },
        {
          title: "Flexible Service",
          description:
            "Choose full-service with staff or convenient drop-off that's ready to serve.",
        },
        {
          title: "Theme Coordination",
          description:
            "We can coordinate our presentation with your party theme for a cohesive look.",
        },
        {
          title: "Stress-Free Hosting",
          description:
            "Focus on your guests while we handle all the food preparation and service.",
        },
        {
          title: "Memorable Moments",
          description:
            "Great food creates great memories. Your guests will talk about this party.",
        },
      ]}
      sampleMenu={[
        {
          category: "Party Favorites",
          items: [
            "Wings (Multiple Flavors)",
            "Mini Sliders Bar",
            "Mac & Cheese Bites",
            "Deviled Eggs",
          ],
        },
        {
          category: "Main Dishes",
          items: [
            "Fried Chicken Tenders",
            "BBQ Ribs",
            "Baked Ham",
            "Vegetable Lasagna",
          ],
        },
        {
          category: "Desserts",
          items: [
            "Banana Pudding Cups",
            "Sweet Potato Pie Bites",
            "Cookie Platter",
            "Peach Cobbler Shots",
          ],
        },
      ]}
    />
  );
}
