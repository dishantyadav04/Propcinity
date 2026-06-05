import { Project } from "@/types/project";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    slug: "lodha-luxuria-pune",
    name: "Lodha Luxuria",
    builderName: "Lodha Group",
    location: "Kharadi",
    city: "Pune",
    lat: 18.551,
    lng: 73.943,
    tagline: "Ultra-luxury living in the heart of East Pune",
    description: "Experience world-class amenities and unmatched luxury at Kharadi's most prestigious address.",
    reraStatus: "registered",
    reraId: "P52100012345",
    reraExpiry: "2028-12-31",
    launchDate: "2023-01-01",
    possessionDate: "2027-06-30",
    totalUnits: 450,
    availableUnits: 120,
    unitConfigs: [
      {
        id: "u1",
        type: "2BHK",
        area: 1150,
        priceMin: 11500000,
        priceMax: 12500000,
        pricePerSqFt: 10000,
        floor: "High",
        facing: ["East", "Garden"],
        highlights: ["Spacious balcony", "Smart home automation"]
      },
      {
        id: "u2",
        type: "3BHK",
        area: 1650,
        priceMin: 16500000,
        priceMax: 18500000,
        pricePerSqFt: 10000,
        floor: "Any",
        facing: ["West", "Clubhouse"],
        highlights: ["Walk-in wardrobe", "Premium marble flooring"]
      }
    ],
    pros: ["Premium builder reputation", "Walking distance to IT parks", "Advanced smart home features"],
    cons: ["Higher than average price per sqft", "Ongoing construction noise"],
    amenities: ["Olympic Pool", "Sky Lounge", "24/7 Concierge", "Private Theatre"],
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200"],
    constructionStatus: "under_construction",
    constructionPercent: 45,
    litigation: false,
    isPublished: true
  },
  {
    id: "p2",
    slug: "godrej-infinity-pune",
    name: "Godrej Infinity",
    builderName: "Godrej Properties",
    location: "Keshav Nagar",
    city: "Pune",
    lat: 18.535,
    lng: 73.957,
    tagline: "Sustainable homes by the riverside",
    description: "Nestled along the Mula-Mutha river, Infinity offers a perfect blend of nature and modern living.",
    reraStatus: "registered",
    reraId: "P52100054321",
    reraExpiry: "2026-06-30",
    launchDate: "2021-06-01",
    possessionDate: "2026-03-31",
    totalUnits: 800,
    availableUnits: 50,
    unitConfigs: [
      {
        id: "u3",
        type: "1BHK",
        area: 650,
        priceMin: 5500000,
        priceMax: 6000000,
        pricePerSqFt: 8461,
        floor: "Mid",
        facing: ["East"],
        highlights: ["Compact design", "Excellent ventilation"]
      }
    ],
    pros: ["Strong builder brand", "Excellent appreciation potential", "Eco-friendly design"],
    cons: ["Narrow access roads", "Distance from metro line"],
    amenities: ["Riverwalk", "Organic Farm", "Sports Arena", "Yoga Deck"],
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200"],
    constructionStatus: "under_construction",
    constructionPercent: 85,
    litigation: false,
    isPublished: true
  }
];
