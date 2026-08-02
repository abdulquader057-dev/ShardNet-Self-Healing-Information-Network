/**
 * 🏥 GLOBAL EMERGENCY INFRASTRUCTURE REGISTRY
 * Compressed dataset of global resilience hubs and regional emergency anchors.
 * Designed for 100% offline lookup.
 */

export const GLOBAL_HUBS = [];
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

