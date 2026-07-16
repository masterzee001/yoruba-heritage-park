// Demonstration content for preview mode. Final operational details remain pending.

import cultureArchitectureImg from "@/assets/culture-architecture.jpg";
import waterReflectionImg from "@/assets/water-reflection.jpg";

export const SITE = {
  name: "Yoruba Heritage Park",
  location: "Ogun State, Nigeria",
  tagline: "Enter a Living Yorùbá World",
  subline: "Culture. Nature. Prayer. Discovery. Renewal.",
};

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/discover", label: "Discover" },
  { to: "/experiences", label: "Experiences" },
  { to: "/events", label: "Events" },
  { to: "/plan", label: "Plan Your Visit" },
  { to: "/learn", label: "Learn" },
] as const;

export const EXPERIENCES = [
  {
    slug: "cultural-tours",
    title: "Cultural Tours",
    category: "Culture and Heritage",
    duration: "Duration pending",
    availability: "Pending confirmation",
    summary:
      "Guided walks through cultural grounds, traditional architecture and living craft practices.",
    image:
      "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "prayer-walks",
    title: "Prayer Walks",
    category: "Prayer and Reflection",
    duration: "Duration pending",
    availability: "Pending confirmation",
    summary: "Quiet, guided walks through the forest for reflection, prayer and stillness.",
    image: waterReflectionImg,
  },
  {
    slug: "purification",
    title: "Purification and Realignment",
    category: "Purification and Realignment",
    duration: "By arrangement",
    availability: "Enquiry only",
    summary: "Personal sessions guided by cultural custodians. Content pending cultural approval.",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "divination",
    title: "Divination",
    category: "Divination",
    duration: "By arrangement",
    availability: "Enquiry only",
    summary: "Traditional divination sittings with senior practitioners. Details to be confirmed.",
    image:
      "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "hunters-baba-olode",
    title: "Hunters with Baba Olóde",
    category: "Nature and Adventure",
    duration: "Duration pending",
    availability: "Pending confirmation",
    summary:
      "A guided forest walk in the tradition of the hunter, with elder knowledge and bush lore.",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "oriki-heritage",
    title: "Oríkì and Heritage",
    category: "Oríkì and Heritage",
    duration: "By arrangement",
    availability: "Enquiry only",
    summary:
      "Personal and family Oríkì consultations, written or recorded, with heritage guidance.",
    image: cultureArchitectureImg,
  },
];

export const EVENTS = [
  {
    slug: "daily-cultural-tour",
    title: "Daily Cultural Tour",
    date: "Schedule pending",
    time: "Time pending",
    category: "Cultural Tours",
    availability: "Pending confirmation",
  },
  {
    slug: "morning-prayer-walk",
    title: "Morning Prayer Walk",
    date: "Schedule pending",
    time: "Time pending",
    category: "Prayer and Reflection",
    availability: "Pending confirmation",
  },
  {
    slug: "purification-session",
    title: "Purification Session",
    date: "By appointment",
    time: "By arrangement",
    category: "Purification",
    availability: "Enquiry only",
  },
  {
    slug: "hunters-walk",
    title: "Hunters with Baba Olóde",
    date: "Schedule pending",
    time: "Time pending",
    category: "Nature and Adventure",
    availability: "Pending confirmation",
  },
  {
    slug: "craft-workshop",
    title: "Textile and Craft Workshop",
    date: "Schedule pending",
    time: "Time pending",
    category: "Workshops",
    availability: "Pending confirmation",
  },
  {
    slug: "private-ceremony",
    title: "Private Ceremony",
    date: "By arrangement",
    time: "—",
    category: "Ceremonies",
    availability: "Enquiry only",
  },
];

export const HUTS = [
  {
    slug: "iroko",
    name: "Iroko Model",
    features: ["1 bedroom", "Forest verandah", "Outdoor bath"],
    setting: "Deep canopy",
  },
  {
    slug: "ayin",
    name: "Àyìn Model",
    features: ["2 bedrooms", "Study lounge", "Private courtyard"],
    setting: "Grove edge",
  },
  {
    slug: "opepe",
    name: "Opepe Model",
    features: ["3 bedrooms", "Family lounge", "Extended deck"],
    setting: "Ridge view",
  },
];

export const TICKET_TYPES = [
  { id: "general", label: "General Admission", price: 0 },
  { id: "guided", label: "Guided Tour", price: 0 },
  { id: "cultural", label: "Cultural Tour", price: 0 },
  { id: "prayer", label: "Prayer Walk", price: 0 },
  { id: "school", label: "School Group", price: 0 },
  { id: "private", label: "Private Group", price: 0 },
  { id: "event", label: "Special Event", price: 0 },
];

export const SOS_CATEGORIES = [
  "Security threat",
  "Medical emergency",
  "Lost or separated",
  "Fire",
  "Accident or injury",
  "Dangerous animal",
  "Other emergency",
];
