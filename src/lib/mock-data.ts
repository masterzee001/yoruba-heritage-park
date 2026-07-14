// Mock content for the Yoruba Heritage Park prototype.
// All content marked "Sample content" / "To be confirmed" per brief.

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
    duration: "2 hours",
    availability: "Daily, scheduled",
    summary:
      "Guided walks through cultural grounds, traditional architecture and living craft practices.",
    image:
      "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "prayer-walks",
    title: "Prayer Walks",
    category: "Prayer and Reflection",
    duration: "90 minutes",
    availability: "Morning and evening",
    summary: "Quiet, guided walks through the forest for reflection, prayer and stillness.",
    image:
      "https://images.unsplash.com/photo-1441829266145-6d4bfb46f1e5?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "purification",
    title: "Purification and Realignment",
    category: "Purification and Realignment",
    duration: "By appointment",
    availability: "Appointment only",
    summary: "Personal sessions guided by cultural custodians. Content pending cultural approval.",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "divination",
    title: "Divination",
    category: "Divination",
    duration: "By appointment",
    availability: "Appointment only",
    summary: "Traditional divination sittings with senior practitioners. Details to be confirmed.",
    image:
      "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "hunters-baba-olode",
    title: "Hunters with Baba Olóde",
    category: "Nature and Adventure",
    duration: "Half day",
    availability: "Scheduled",
    summary:
      "A guided forest walk in the tradition of the hunter, with elder knowledge and bush lore.",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    slug: "oriki-heritage",
    title: "Oríkì and Heritage",
    category: "Oríkì and Heritage",
    duration: "By appointment",
    availability: "Consultation",
    summary:
      "Personal and family Oríkì consultations, written or recorded, with heritage guidance.",
    image:
      "https://images.unsplash.com/photo-1524492514790-8c34a72e59f2?auto=format&fit=crop&w=1400&q=80",
  },
];

export const EVENTS = [
  {
    slug: "daily-cultural-tour",
    title: "Daily Cultural Tour",
    date: "Sample — every day",
    time: "10:00 · 14:00",
    category: "Cultural Tours",
    availability: "Open",
  },
  {
    slug: "morning-prayer-walk",
    title: "Morning Prayer Walk",
    date: "Sample — weekdays",
    time: "06:30",
    category: "Prayer and Reflection",
    availability: "Limited",
  },
  {
    slug: "purification-session",
    title: "Purification Session",
    date: "Sample — by appointment",
    time: "By arrangement",
    category: "Purification",
    availability: "Appointment only",
  },
  {
    slug: "hunters-walk",
    title: "Hunters with Baba Olóde",
    date: "Sample — Saturdays",
    time: "06:00",
    category: "Nature and Adventure",
    availability: "Limited",
  },
  {
    slug: "craft-workshop",
    title: "Textile and Craft Workshop",
    date: "Sample — first Saturday",
    time: "11:00",
    category: "Workshops",
    availability: "Open",
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
