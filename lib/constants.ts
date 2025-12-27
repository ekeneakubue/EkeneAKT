// Category structure matching AKT website
export const categoryStructure = [
  {
    id: "led-bulb",
    name: "LED BULB",
    count: 20,
    subcategories: [
      { id: "cup-bulb", name: "Cup Bulb", count: 7 },
      { id: "round-bulb", name: "Round Bulb", count: 5 },
      { id: "rechargeable-bulb", name: "Rechargeable Bulb", count: 8 },
      { id: "specialty-bulb", name: "Specialty Bulb", count: 0 },
    ],
  },
  {
    id: "led-panel-light",
    name: "LED PANEL LIGHT",
    count: 18,
    subcategories: [
      { id: "led-pop", name: "LED POP", count: 6 },
      { id: "led-surface", name: "LED Surface", count: 4 },
      { id: "led-cob-pop", name: "LED COB POP", count: 6 },
      { id: "led-modular", name: "LED Modular", count: 2 },
    ],
  },
  {
    id: "led-flood-light",
    name: "LED FLOOD LIGHT",
    count: 11,
    subcategories: [
      { id: "ac-flood-light", name: "AC Flood Light", count: 8 },
      { id: "solar-flood-light", name: "Solar Flood Light", count: 3 },
    ],
  },
  {
    id: "led-solar-street-light",
    name: "LED SOLAR STREET LIGHT",
    count: 20,
    subcategories: [
      { id: "integrated-solar-street-light", name: "Integrated Solar Street Light", count: 13 },
      { id: "split-type-solar-street-light", name: "Split-Type Solar Street Light", count: 0 },
      { id: "high-power-solar-street-light", name: "High-Power/High-Brightness Solar Street Light (Engineering Use)", count: 7 },
      { id: "smart-control-solar-street-light", name: "Smart Control Solar Street Light (Civil Use)", count: 0 },
    ],
  },
  {
    id: "led-outdoor-light",
    name: "LED OUTDOOR LIGHT",
    count: 30,
    subcategories: [
      { id: "led-landscape-light", name: "LED Landscape Light", count: 0 },
      { id: "led-garden-light", name: "LED Garden Light", count: 4 },
      { id: "led-decorative-light", name: "LED Decorative Light", count: 7 },
      { id: "led-wall-wash-light", name: "LED Wall-Wash Light", count: 0 },
      { id: "sensor-smart-control-light", name: "Sensor/Smart-Control Light", count: 0 },
      { id: "bollard-light", name: "Bollard Light", count: 0 },
      { id: "led-street-light-ac", name: "Led Street Light(AC)", count: 0 },
      { id: "swimming-pool-light", name: "Swimming Pool Light", count: 0 },
      { id: "led-wall-light", name: "Led Wall Light", count: 19 },
    ],
  },
  {
    id: "factory-station-light",
    name: "FACTORY/STATION LIGHT",
    count: 1,
    subcategories: [
      { id: "high-bay-light", name: "High Bay Light", count: 1 },
      { id: "canopy-light", name: "Canopy Light", count: 0 },
    ],
  },
  {
    id: "solar-home-appliances",
    name: "SOLAR HOME APPLIANCES",
    count: 8,
    subcategories: [
      { id: "solar-panels", name: "Solar Panels", count: 0 },
      { id: "solar-fan", name: "Solar Fan", count: 2 },
      { id: "solar-power-system", name: "Solar Power System", count: 6 },
      { id: "solar-inverter", name: "Solar Inverter", count: 3 },
      { id: "solar-battery", name: "Solar Battery", count: 3 },
    ],
  },
  {
    id: "switch-and-sockets",
    name: "SWITCH AND SOCKETS",
    count: 22,
    subcategories: [
      { id: "residential-switches", name: "Residential Switches", count: 9 },
      { id: "industrial-switches", name: "Industrial Switches", count: 0 },
      { id: "waterproof-rustproof-switches", name: "Waterproof/Rustproof Switches", count: 9 },
      { id: "extensions", name: "Extensions", count: 4 },
    ],
  },
  {
    id: "led-fitting-tube",
    name: "LED FITTING/TUBE",
    count: 0,
    subcategories: [],
  },
  {
    id: "led-linear-light",
    name: "LED LINEAR LIGHT",
    count: 0,
    subcategories: [],
  },
  {
    id: "led-track-light",
    name: "LED Track Light",
    count: 0,
    subcategories: [
      { id: "fixed-adjustable-beam-track-lights", name: "Fixed/Adjustable Beam Track Lights", count: 0 },
      { id: "magnetic-track-lights", name: "Magnetic Track Lights", count: 0 },
      { id: "recessed-track-lights", name: "Recessed Track Lights", count: 0 },
      { id: "pendant-track-lights", name: "Pendant Track Lights", count: 0 },
      { id: "dali-smart-control-track-lights", name: "DALI/Smart Control Track Lights", count: 0 },
    ],
  },
  {
    id: "wire-cable",
    name: "Wire & Cable",
    count: 0,
    subcategories: [],
  },
];

// Helper function to get subcategories for a given category name
export function getSubcategoriesForCategory(categoryName: string) {
  const category = categoryStructure.find((cat) => cat.name === categoryName);
  return category ? category.subcategories.map((sub) => sub.name) : [];
}

// Get all category names
export function getAllCategoryNames() {
  return categoryStructure.map((cat) => cat.name);
}

