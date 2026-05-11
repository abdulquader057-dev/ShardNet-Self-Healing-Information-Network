/**
 * 🏥 GLOBAL EMERGENCY INFRASTRUCTURE REGISTRY
 * Compressed dataset of global resilience hubs and regional emergency anchors.
 * Designed for 100% offline lookup.
 */

export const GLOBAL_HUBS = [
  // 🇮🇳 INDIA FOCUS: STRATEGIC NODES
  { id: 'in1', type: 'hospital', name: 'AIIMS New Delhi', lat: 28.5672, lng: 77.2100, info: 'Premier Medical Research & Trauma' },
  { id: 'in2', type: 'hospital', name: 'Apollo Hospitals Mumbai', lat: 19.0178, lng: 73.0189, info: 'Critical Care & Emergency' },
  { id: 'in3', type: 'reservoir', name: 'Bhakra Nangal Reservoir', lat: 31.4117, lng: 76.4356, info: 'Critical Water & Power' },
  { id: 'in4', type: 'shelter', name: 'NDRF Base Ghaziabad', lat: 28.6692, lng: 77.4538, info: 'Disaster Response Command' },
  { id: 'in5', type: 'hospital', name: 'NIMHANS Bangalore', lat: 12.9431, lng: 77.5910, info: 'Neuro & Emergency Support' },
  { id: 'in6', type: 'reservoir', name: 'Indira Sagar Dam', lat: 22.2858, lng: 76.4667, info: 'Major Water Resource' },
  { id: 'in7', type: 'hospital', name: 'CMC Vellore', lat: 12.9255, lng: 79.1325, info: 'High-Capacity Regional Med-Hub' },
  { id: 'in8', type: 'danger', name: 'High-Flood Risk Zone (Bihar)', lat: 25.5941, lng: 85.1376, info: 'Seasonal Flooding Danger' },

  // 🌍 GLOBAL STRATEGIC ANCHORS
  { id: 'h1', type: 'hospital', name: 'Mayo Clinic (USA)', lat: 44.0225, lng: -92.4668, info: 'Global Med-Center' },
  { id: 'h2', type: 'hospital', name: 'Charité Berlin (DE)', lat: 52.5256, lng: 13.3781, info: 'European Research Anchor' },
  { id: 'h3', type: 'shelter', name: 'Svalbard Global Seed Vault', lat: 78.2357, lng: 15.4913, info: 'Genetic Survival Hub' },
  { id: 'h4', type: 'hospital', name: 'Singapore General', lat: 1.2796, lng: 103.8344, info: 'Asia-Pacific Med-Command' },
  { id: 'h5', type: 'reservoir', name: 'Three Gorges (CN)', lat: 30.8239, lng: 111.0033, info: 'Massive Water/Power Node' },
  { id: 'h6', type: 'safezone', name: 'Antarctic Research Base', lat: -77.8419, lng: 166.6863, info: 'Isolated Survival Outpost' },
  { id: 'h7', type: 'hospital', name: 'St George Sydney', lat: -33.9664, lng: 151.1340, info: 'Oceania Emergency Hub' },
];

export const MEDICINES = [
  { name: 'Ciprofloxacin', type: 'Antibiotic', use: 'Bacterial Infections / Anthrax' },
  { name: 'Potassium Iodide', type: 'Radioprotective', use: 'Radiation Exposure' },
  { name: 'Atropine', type: 'Nerve Agent Antidote', use: 'Chemical Exposure' },
  { name: 'Epinephrine', type: 'Life Support', use: 'Anaphylaxis / Heart Stop' },
  { name: 'QuikClot', type: 'Hemostatic', use: 'Severe Bleeding Control' },
  { name: 'Tamiflu', type: 'Anti-viral', use: 'Respiratory Outbreaks' },
  { name: 'ORS Packets', type: 'Hydration', use: 'Cholera / Dehydration' },
];

export const SURVIVAL_MEASURES = [
  { title: 'Water Purification', steps: ['Boil for 5 mins', 'Use 8 drops bleach per gallon', 'Filter through charcoal'] },
  { title: 'Signal SOS', steps: ['3 short, 3 long, 3 short (Visual)', 'Mirror reflect to aircraft', 'Contrast ground markers'] },
  { title: 'Wound Packing', steps: ['Clean with saline', 'Pack tight with gauze', 'Apply constant pressure'] },
  { title: 'Radiation Prep', steps: ['Seal windows/doors', 'Remove outer clothing', 'Shower if possible'] },
];

export const INFRA_ICONS = {
  hospital: { emoji: '🏥', color: '#ef4444' },
  shelter: { emoji: '🏠', color: '#3b82f6' },
  reservoir: { emoji: '💧', color: '#06b6d4' },
  safezone: { emoji: '🛡️', color: '#10b981' },
  danger: { emoji: '☢️', color: '#f59e0b' },
  generic: { emoji: '📍', color: '#94a3b8' }
};

