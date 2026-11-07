import jollof from "@/assets/jollof.jpg";
import friedRice from "@/assets/fried-rice.jpg";
import familyPack from "@/assets/family-pack.jpg";
import coconutRice from "@/assets/coconut-rice.jpg";
import foodBox from "@/assets/food-box.jpg";
import catering from "@/assets/catering.jpg";
import soloChicken from "@/assets/solo-chicken.jpg";
import soloColeslaw from "@/assets/solo-coleslaw.jpg";
import jollyFest from "@/assets/jolly-fest.jpg";

export type OptionChoice = { id: string; label: string };

export type OptionGroup = {
  id: string;
  label: string;
  choices: OptionChoice[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: CategoryId;
  badge?: string;
  /** Regular price shown struck through beside a reduced price. */
  wasPrice?: number;
  note?: string;
  serves?: string;
  options?: OptionGroup[];
  /** Base meal choices with their own published prices (rice + protein). */
  meals?: { id: string; label: string; price: number }[];
  /** Add-ons counted per portion. soloPrice applies when it is the only thing ordered. max caps the portions (e.g. Extra Rice tops up one plate). */
  extras?: { id: string; label: string; price: number; group: "Extras" | "Sides"; soloPrice?: number; max?: number }[];
  available: boolean;
};

export type CategoryId = string;

export const categories: {
  id: CategoryId;
  label: string;
  tagline: string;
  image: string;
}[] = [
  {
    id: "daily",
    label: "Daily Meals",
    tagline: "Fresh every day at our Awka Food Hub",
    image: jollof,
  },
  {
    id: "bulk",
    label: "Bulk Home Orders",
    tagline: "Large portions for family & small gatherings",
    image: familyPack,
  },
  {
    id: "boxes",
    label: "Food Boxes",
    tagline: "Curated meal boxes made for gifting",
    image: foodBox,
  },
];

const proteinGroup: OptionGroup = {
  id: "protein",
  label: "Choice of protein",
  choices: [
    { id: "chicken", label: "Chicken" },
    { id: "turkey", label: "Turkey" },
    { id: "beef", label: "Beef" },
  ],
};

function specialMeals(dish: string) {
  return [
    { id: "egg", label: `${dish} & Egg`, price: 1800 },
    { id: "beef", label: `${dish} & Beef`, price: 2000 },
    { id: "chicken", label: `${dish} & Chicken`, price: 3000 },
    { id: "turkey", label: `${dish} & Turkey`, price: 4000 },
    { id: "jumbo-turkey", label: `${dish} & Jumbo Turkey`, price: 5000 },
    { id: "no-protein", label: `${dish} only — no protein`, price: 1500 },
    { id: "none", label: "No rice — extras & sides only", price: 0 },
  ];
}

const specialExtras: NonNullable<Product["extras"]> = [
  { id: "rice", label: "Extra Rice", price: 1000, group: "Extras", max: 1 },
  { id: "chicken", label: "Extra Chicken", price: 1500, group: "Extras", soloPrice: 2000 },
  { id: "beef", label: "Extra Beef", price: 500, group: "Extras" },
  { id: "egg", label: "Extra Egg", price: 300, group: "Extras" },
  { id: "turkey", label: "Extra Turkey", price: 2500, group: "Extras" },
  { id: "jumbo-turkey", label: "Extra Jumbo Turkey", price: 3500, group: "Extras" },
  { id: "water", label: "Water", price: 300, group: "Extras" },
  { id: "plantain", label: "Plantain", price: 500, group: "Sides" },
  { id: "coleslaw", label: "Coleslaw", price: 500, group: "Sides", soloPrice: 1000 },
];

export const products: Product[] = [
  {
    id: "mcrelish-jollof",
    name: "McRelish Special Jollof",
    description:
      "Rich tomato blend and perfectly seasoned rice. Pick your protein, then add extras and sides your way.",
    price: 1800,
    image: jollof,
    category: "daily",
    badge: "Most loved",
    note: "Available for walk-in and pickup.",
    meals: specialMeals("Special Jollof"),
    extras: specialExtras,
    available: true,
  },
  {
    id: "special-fried-rice",
    name: "McRelish Special Fried Rice",
    description: "Colorful fried rice with fresh vegetables. Pick your protein, then add extras and sides your way.",
    price: 1800,
    image: friedRice,
    category: "daily",
    meals: specialMeals("Special Fried Rice"),
    extras: specialExtras,
    note: "Coming soon",
    available: false,
  },
  {
    id: "jolly-fest",
    name: "Jolly Fest Feast",
    description:
      "A plate of McRelish Special Jollof, 1 peppered chicken, 2 pieces of peppered beef, 1 portion of plantain, 1 coleslaw, 1 bottled water and 1 zobo drink.",
    price: 5500,
    wasPrice: 6800,
    image: jollyFest,
    category: "daily",
    badge: "November Jolly Fest",
    available: true,
  },
  {
    id: "solo-chicken",
    name: "Chicken — Solo Plate",
    description: "Our well-seasoned chicken served on its own, no rice.",
    price: 2000,
    image: soloChicken,
    category: "daily",
    badge: "On its own",
    available: true,
  },
  {
    id: "solo-coleslaw",
    name: "Coleslaw — Solo Plate",
    description: "Fresh, creamy coleslaw served on its own.",
    price: 1000,
    image: soloColeslaw,
    category: "daily",
    badge: "On its own",
    available: true,
  },
  {
    id: "family-jollof-pack",
    name: "Family Jollof Pack",
    description: "Jollof Rice with your choice of chicken, turkey, or beef, prepared in a family-size portion.",
    price: 7500,
    image: familyPack,
    category: "bulk",
    serves: "Serves 5–6",
    options: [proteinGroup],
    available: true,
  },
  {
    id: "deluxe-fried-rice",
    name: "Deluxe Fried Rice",
    description: "Mixed vegetables and your choice of protein.",
    price: 7500,
    image: friedRice,
    category: "bulk",
    serves: "Serves 5–6",
    options: [proteinGroup],
    available: true,
  },
  {
    id: "coconut-rice-pack",
    name: "Coconut Rice Pack",
    description: "Aromatic coconut-infused rice with protein options.",
    price: 8000,
    image: coconutRice,
    category: "bulk",
    serves: "Serves 5–6",
    options: [proteinGroup],
    available: true,
  },
  {
    id: "classic-box",
    name: "The Classic Box",
    description: "Includes Jollof Rice, Sides, and choice of protein.",
    price: 4500,
    image: foodBox,
    category: "boxes",
    options: [proteinGroup],
    available: true,
  },
  {
    id: "premium-box",
    name: "The Premium Box",
    description: "Includes Deluxe Fried Rice, Sides, and choice of protein.",
    price: 6000,
    image: foodBox,
    category: "boxes",
    options: [proteinGroup],
    available: true,
  },
  {
    id: "gourmet-box",
    name: "The Gourmet Box",
    description: "Includes Coconut Rice, Sides, and premium Proteins.",
    price: 7500,
    image: foodBox,
    category: "boxes",
    available: true,
  },
  {
    id: "celebration-box",
    name: "The Celebration Box",
    description: "Includes Native Rice, Deluxe Sides, and Proteins.",
    price: 9000,
    image: foodBox,
    category: "boxes",
    available: true,
  },
];

export const cateringImage = catering;

/** Catering menu, exactly as listed on mcrelish.com. Pricing is by quotation. */
export const cateringMenu: { group: string; items: string[] }[] = [
  {
    group: "Rice Dishes",
    items: [
      "Jollof Rice (Party Style)",
      "Fried Rice",
      "White Rice",
      "Coconut Rice",
      "Rice & Beans",
      "Native Rice",
      "Chinese Rice",
      "Asun Jollof Rice",
      "Ofada Rice",
    ],
  },
  {
    group: "Stews & Sauces",
    items: [
      "Tomato Stew",
      "Egg Sauce",
      "Garden Egg Sauce",
      "Pepper Sauce (Ata Dindin)",
      "Vegetable Sauce",
      "Ayamase Sauce",
      "Shito",
    ],
  },
  {
    group: "Soups",
    items: ["Egusi", "Ogbono", "Okra", "Efo Riro", "Afang", "Edikaikong", "Nsala", "Oha", "Banga", "Bitterleaf"],
  },
  {
    group: "Swallows",
    items: ["Eba", "Pounded Yam", "Fufu", "Semovita", "Wheat", "Amala"],
  },
  {
    group: "Proteins",
    items: [
      "Fried Chicken",
      "Grilled Chicken",
      "Peppered Turkey",
      "Suya Chicken / Beef",
      "Goat Meat Pepper Soup",
      "Beef Stew",
      "Gizzard Sauce",
      "Catfish Pepper Soup",
      "Barbecue Fish",
      "Fried Fish",
    ],
  },
  {
    group: "Sides & Salads",
    items: [
      "Fried Plantain",
      "Boiled Plantain",
      "Yam Porridge",
      "Fried Yam",
      "Moi Moi",
      "Coleslaw",
      "Chicken Salad",
      "Vegetable Salad",
      "Fruit Salad",
      "French Fries",
    ],
  },
];

export const business = {
  name: "McRelish",
  tagline: "Exquisite African Culinary Excellence",
  description: "Delicious meals for individuals, families, workplaces, and life's special occasions.",
  phone: "+234 707 049 2039",
  phoneHref: "tel:+2347070492039",
  email: "info@mcrelish.com",
  city: "Awka, Anambra State, Nigeria",
  hours: "Mon–Sat: 4:30PM – 9PM",
  founded: 2020,
  socials: [
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/mcrelish_/" },
    { id: "tiktok", label: "TikTok", href: "https://tiktok.com/@mcrelish" },
    { id: "x", label: "X", href: "https://x.com/mcrelishco" },
    { id: "facebook", label: "Facebook", href: "https://facebook.com/mcrelish" },
  ] as { id: "instagram" | "tiktok" | "x" | "facebook"; label: string; href: string }[],
};

export const locations = [
  {
    id: "awka",
    name: "Awka Food Hub",
    address: "Awka, Anambra State, Nigeria",
    hours: business.hours,
    phone: business.phone,
    status: "Open for walk-in & pickup",
    open: true,
  },
  {
    id: "aroma",
    name: "Aroma Food Hub",
    address: "Aroma, Awka, Anambra State, Nigeria",
    hours: business.hours,
    phone: business.phone,
    status: "Open for walk-in & pickup",
    open: true,
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
