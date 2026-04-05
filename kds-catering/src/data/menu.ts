export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  dietary: string[];
  popular?: boolean;
}

export const menuItems: MenuItem[] = [
  // Appetizers
  {
    id: "app-1",
    name: "Crispy Crab Cakes",
    description: "Golden-fried crab cakes served with creamy remoulade sauce",
    category: "appetizers",
    dietary: [],
    popular: true,
  },
  {
    id: "app-2",
    name: "Deviled Eggs",
    description: "Classic Southern deviled eggs with paprika and chive garnish",
    category: "appetizers",
    dietary: ["vegetarian", "gluten-free"],
  },
  {
    id: "app-3",
    name: "Shrimp & Grits Bites",
    description: "Mini portions of our signature shrimp and cheesy grits",
    category: "appetizers",
    dietary: ["gluten-free"],
    popular: true,
  },
  {
    id: "app-4",
    name: "Fried Green Tomatoes",
    description: "Crispy cornmeal-crusted green tomatoes with ranch drizzle",
    category: "appetizers",
    dietary: ["vegetarian"],
  },
  {
    id: "app-5",
    name: "Buffalo Cauliflower Bites",
    description: "Crispy cauliflower tossed in spicy buffalo sauce",
    category: "appetizers",
    dietary: ["vegan", "vegetarian"],
  },
  {
    id: "app-6",
    name: "Mini Chicken & Waffles",
    description: "Bite-sized crispy chicken on mini waffles with maple syrup",
    category: "appetizers",
    dietary: [],
    popular: true,
  },

  // Entrées
  {
    id: "ent-1",
    name: "Southern Fried Chicken",
    description: "Crispy, golden-fried chicken with our secret spice blend",
    category: "entrees",
    dietary: ["gluten-free"],
    popular: true,
  },
  {
    id: "ent-2",
    name: "Slow-Smoked BBQ Ribs",
    description: "Fall-off-the-bone ribs with house-made BBQ sauce",
    category: "entrees",
    dietary: ["gluten-free"],
    popular: true,
  },
  {
    id: "ent-3",
    name: "Honey-Glazed Ham",
    description: "Brown sugar and honey glazed ham, carved to order",
    category: "entrees",
    dietary: ["gluten-free"],
  },
  {
    id: "ent-4",
    name: "Blackened Catfish",
    description: "Cajun-spiced catfish with lemon butter sauce",
    category: "entrees",
    dietary: ["gluten-free"],
  },
  {
    id: "ent-5",
    name: "Herb-Roasted Chicken",
    description: "Whole roasted chicken with fresh herbs and garlic",
    category: "entrees",
    dietary: ["gluten-free"],
  },
  {
    id: "ent-6",
    name: "Smothered Pork Chops",
    description: "Tender pork chops in rich onion gravy",
    category: "entrees",
    dietary: [],
  },
  {
    id: "ent-7",
    name: "Vegetable Jambalaya",
    description: "Spicy rice dish with seasonal vegetables and Cajun spices",
    category: "entrees",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },
  {
    id: "ent-8",
    name: "BBQ Pulled Pork",
    description: "Slow-cooked pulled pork with tangy BBQ sauce",
    category: "entrees",
    dietary: ["gluten-free"],
  },

  // Sides
  {
    id: "side-1",
    name: "Creamy Mac & Cheese",
    description: "Three-cheese blend baked to bubbly, golden perfection",
    category: "sides",
    dietary: ["vegetarian"],
    popular: true,
  },
  {
    id: "side-2",
    name: "Collard Greens",
    description: "Slow-cooked with smoked turkey for authentic Southern flavor",
    category: "sides",
    dietary: ["gluten-free"],
    popular: true,
  },
  {
    id: "side-3",
    name: "Candied Yams",
    description: "Sweet potatoes in brown sugar and cinnamon glaze",
    category: "sides",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },
  {
    id: "side-4",
    name: "Southern Cornbread",
    description: "Slightly sweet, buttery cornbread baked fresh",
    category: "sides",
    dietary: ["vegetarian"],
  },
  {
    id: "side-5",
    name: "Black-Eyed Peas",
    description: "Traditional Southern black-eyed peas with savory seasonings",
    category: "sides",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },
  {
    id: "side-6",
    name: "Garlic Mashed Potatoes",
    description: "Creamy mashed potatoes with roasted garlic",
    category: "sides",
    dietary: ["vegetarian", "gluten-free"],
  },
  {
    id: "side-7",
    name: "Green Bean Casserole",
    description: "Fresh green beans in creamy mushroom sauce with crispy onions",
    category: "sides",
    dietary: ["vegetarian"],
  },
  {
    id: "side-8",
    name: "Cole Slaw",
    description: "Crispy cabbage in creamy, tangy dressing",
    category: "sides",
    dietary: ["vegetarian", "gluten-free"],
  },

  // Desserts
  {
    id: "des-1",
    name: "Peach Cobbler",
    description: "Warm cinnamon-spiced peaches with buttery biscuit topping",
    category: "desserts",
    dietary: ["vegetarian"],
    popular: true,
  },
  {
    id: "des-2",
    name: "Banana Pudding",
    description: "Layers of vanilla wafers, fresh bananas, and creamy pudding",
    category: "desserts",
    dietary: ["vegetarian"],
    popular: true,
  },
  {
    id: "des-3",
    name: "Sweet Potato Pie",
    description: "Classic Southern sweet potato pie with whipped cream",
    category: "desserts",
    dietary: ["vegetarian"],
  },
  {
    id: "des-4",
    name: "Red Velvet Cake",
    description: "Moist red velvet layers with cream cheese frosting",
    category: "desserts",
    dietary: ["vegetarian"],
  },
  {
    id: "des-5",
    name: "Pecan Pie",
    description: "Rich, buttery pecan pie with flaky crust",
    category: "desserts",
    dietary: ["vegetarian"],
  },
  {
    id: "des-6",
    name: "Vegan Chocolate Mousse",
    description: "Silky dairy-free chocolate mousse with coconut cream",
    category: "desserts",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },

  // Beverages
  {
    id: "bev-1",
    name: "Sweet Tea",
    description: "Classic Southern sweet iced tea",
    category: "beverages",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },
  {
    id: "bev-2",
    name: "Fresh Lemonade",
    description: "House-made lemonade with fresh-squeezed lemons",
    category: "beverages",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },
  {
    id: "bev-3",
    name: "Arnold Palmer",
    description: "Half sweet tea, half lemonade",
    category: "beverages",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },
  {
    id: "bev-4",
    name: "Fruit Punch",
    description: "Refreshing blend of tropical fruit juices",
    category: "beverages",
    dietary: ["vegan", "vegetarian", "gluten-free"],
  },
];
