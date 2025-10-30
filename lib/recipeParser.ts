// Efficient recipe parsing utilities
// Optimized for dual measurement system (Imperial + Metric)

import { MeasurementSystem } from "@prisma/client";
import { RecipeIngredient, RecipeStep } from "@/types/recipe";

/**
 * Parse fraction string to decimal for conversion calculations
 */
function parseFraction(str: string): number | null {
  // Handle range (e.g., "2-3") - use midpoint
  if (str.includes('-')) {
    const [a, b] = str.split('-').map(s => parseFloat(s.trim()));
    return !isNaN(a) && !isNaN(b) ? (a + b) / 2 : null;
  }
  
  // Handle mixed fraction (e.g., "1 1/2")
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return parseInt(mixed[1]) + (parseInt(mixed[2]) / parseInt(mixed[3]));
  }
  
  // Handle simple fraction (e.g., "1/2")
  const simple = str.match(/^(\d+)\/(\d+)$/);
  if (simple) {
    return parseInt(simple[1]) / parseInt(simple[2]);
  }
  
  // Handle decimal/integer
  const num = parseFloat(str);
  return !isNaN(num) ? num : null;
}

/**
 * Format converted amount with appropriate precision
 */
function formatAmount(value: number): string {
  if (value >= 1000) return Math.round(value).toString();
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return (Math.round(value * 2) / 2).toString();
  if (value >= 1) return (Math.round(value * 10) / 10).toString();
  return (Math.round(value * 100) / 100).toString();
}

/**
 * Conversion table: Imperial ↔ Metric
 */
const CONVERSIONS = {
  // Imperial → Metric
  imperial: {
    'cup': { ml: 240, threshold: 1000 },
    'cups': { ml: 240, threshold: 1000 },
    'tbsp': { ml: 15 },
    'tablespoon': { ml: 15 },
    'tablespoons': { ml: 15 },
    'tsp': { ml: 5 },
    'teaspoon': { ml: 5 },
    'teaspoons': { ml: 5 },
    'oz': { g: 28, threshold: 1000 },
    'ounce': { g: 28, threshold: 1000 },
    'ounces': { g: 28, threshold: 1000 },
    'lb': { g: 454, threshold: 1000 },
    'pound': { g: 454, threshold: 1000 },
    'pounds': { g: 454, threshold: 1000 },
    'fl oz': { ml: 30, threshold: 1000 },
  },
  // Metric → Imperial
  metric: {
    'ml': { cup: 1/240 },
    'milliliter': { cup: 1/240 },
    'milliliters': { cup: 1/240 },
    'l': { cup: 4.227 },
    'liter': { cup: 4.227 },
    'liters': { cup: 4.227 },
    'g': { oz: 1/28 },
    'gram': { oz: 1/28 },
    'grams': { oz: 1/28 },
    'kg': { lb: 2.205 },
    'kilogram': { lb: 2.205 },
    'kilograms': { lb: 2.205 },
  },
} as const;

/**
 * Convert between measurement systems
 * Returns BOTH imperial and metric when possible
 */
function convertMeasurement(amount: string, unit: string) {
  const num = parseFraction(amount);
  if (num === null) return null;
  
  const unitLower = unit.toLowerCase();
  
  // Try Imperial → Metric
  const impConfig = CONVERSIONS.imperial[unitLower as keyof typeof CONVERSIONS.imperial];
  if (impConfig) {
    const [targetUnit, multiplier] = Object.entries(impConfig)[0] as [string, number];
    let converted = num * multiplier;
    let finalUnit = targetUnit;
    
    // Convert to larger unit if threshold exceeded (ml→l, g→kg)
    if ('threshold' in impConfig && converted >= impConfig.threshold) {
      converted /= 1000;
      finalUnit = targetUnit === 'ml' ? 'l' : 'kg';
    }
    
    return {
      imperial: { system: MeasurementSystem.IMPERIAL, amount, unit },
      metric: { system: MeasurementSystem.METRIC, amount: formatAmount(converted), unit: finalUnit },
    };
  }
  
  // Try Metric → Imperial
  const metConfig = CONVERSIONS.metric[unitLower as keyof typeof CONVERSIONS.metric];
  if (metConfig) {
    const [targetUnit, multiplier] = Object.entries(metConfig)[0] as [string, number];
    const converted = num * multiplier;
    
    return {
      metric: { system: MeasurementSystem.METRIC, amount, unit },
      imperial: { system: MeasurementSystem.IMPERIAL, amount: formatAmount(converted), unit: targetUnit },
    };
  }
  
  return null;
}

/**
 * Parse ingredients from textarea
 * Format: "amount unit name (notes) optional"
 * Groups: "For the sauce:"
 */
export function parseIngredients(text: string): RecipeIngredient[] {
  const lines = text.split('\n').filter(l => l.trim());
  const ingredients: RecipeIngredient[] = [];
  let currentGroup: string | null = null;
  let displayOrder = 0;

  for (const line of lines) {
    // Check for group header (e.g., "For the sauce:")
    if (line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)) {
      currentGroup = line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)![1].trim();
      continue;
    }

    // Check if optional
    const isOptional = /\b(optional|garnish)\b/i.test(line);
    const cleanLine = line.replace(/\s*\(?(optional|garnish)\)?\s*$/i, '').trim();

    // Extract notes in parentheses
    const notesMatch = cleanLine.match(/\(([^)]+)\)/);
    const notes = notesMatch ? notesMatch[1].trim() : null;
    const withoutNotes = cleanLine.replace(/\s*\([^)]+\)\s*/g, ' ').trim();

    // Parse: [amount] [unit] [name]
    const parts = withoutNotes.split(/\s+/);
    let amount: string | null = null;
    let unit: string | null = null;
    let name = withoutNotes;

    if (parts.length >= 2 && /^[\d\/\-\.]+$/.test(parts[0])) {
      amount = parts[0];
      
      // Check if second part is a unit
      const commonUnits = Object.keys({...CONVERSIONS.imperial, ...CONVERSIONS.metric});
      if (commonUnits.includes(parts[1].toLowerCase())) {
        unit = parts[1];
        name = parts.slice(2).join(' ');
      } else {
        name = parts.slice(1).join(' ');
      }
    }

    // Generate measurements (dual system if conversion available)
    const measurements = [];
    if (amount && unit) {
      const converted = convertMeasurement(amount, unit);
      if (converted) {
        measurements.push(converted.imperial, converted.metric);
      } else {
        // No conversion - use OTHER system (appears in both views)
        const system = MeasurementSystem.OTHER;
        measurements.push({ system, amount, unit }, { system, amount, unit });
      }
    }

    ingredients.push({
      name: name.trim() || line,
      size: null,
      preparation: null,
      notes,
      groupName: currentGroup,
      isOptional,
      displayOrder: displayOrder++,
      measurements,
    });
  }

  return ingredients;
}

/**
 * Parse steps from textarea
 * Format: one step per line
 * Groups: "For the cake:"
 * Optional: add "(optional)" at end
 */
export function parseSteps(text: string): RecipeStep[] {
  const lines = text.split('\n').filter(l => l.trim());
  const steps: RecipeStep[] = [];
  let currentGroup: string | null = null;
  let stepNumber = 1;

  for (const line of lines) {
    // Check for group header
    if (line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)) {
      currentGroup = line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)![1].trim();
      stepNumber = 1;
      continue;
    }

    const isOptional = /\b(optional|garnish)\b/i.test(line);
    const instruction = line
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/\s*\(?(optional|garnish)\)?\s*$/i, '')
      .trim();

    if (instruction) {
      steps.push({
        stepNumber: stepNumber++,
        instruction,
        groupName: currentGroup,
        isOptional,
      });
    }
  }

  return steps;
}

/**
 * Convert ingredients array back to textarea format
 * Uses first measurement (imperial preferred)
 */
export function ingredientsToText(ingredients: RecipeIngredient[]): string {
  const lines: string[] = [];
  let lastGroup: string | null = null;

  for (const ing of ingredients) {
    if (ing.groupName !== lastGroup) {
      if (ing.groupName) {
        lines.push(`\nFor the ${ing.groupName}:`);
      }
      lastGroup = ing.groupName;
    }

    let line = '';
    const measurement = ing.measurements?.[0];
    if (measurement) {
      line += `${measurement.amount} ${measurement.unit} `;
    }
    line += ing.name;
    if (ing.notes) line += ` (${ing.notes})`;
    if (ing.isOptional) line += ' (optional)';
    
    lines.push(line.trim());
  }

  return lines.join('\n');
}

/**
 * Convert steps array back to textarea format
 */
export function stepsToText(steps: RecipeStep[]): string {
  const lines: string[] = [];
  let lastGroup: string | null = null;

  for (const step of steps) {
    if (step.groupName !== lastGroup) {
      if (step.groupName) {
        lines.push(`\nFor the ${step.groupName}:`);
      }
      lastGroup = step.groupName;
    }

    let line = step.instruction;
    if (step.isOptional) line += ' (optional)';
    lines.push(line);
  }

  return lines.join('\n');
}
