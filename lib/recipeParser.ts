// Utility functions for parsing recipe input

import { MeasurementSystem } from "@prisma/client";

export interface ParsedIngredient {
  amount: string | null;
  unit: string | null;
  name: string;
  notes: string | null;
  groupName: string | null;
  isOptional: boolean;
  displayOrder: number;
}

export interface NewIngredientFormat {
  name: string;
  size: string | null;
  preparation: string | null;
  notes: string | null;
  groupName: string | null;
  isOptional: boolean;
  displayOrder: number;
  measurements: Array<{
    system: MeasurementSystem;
    amount: string;
    unit: string;
  }>;
}

export interface ParsedStep {
  stepNumber: number;
  instruction: string;
  groupName: string | null;
  isOptional: boolean;
}

/**
 * Convert old ingredient format to new measurement system format
 * This creates a single measurement entry (either IMPERIAL, METRIC, or OTHER based on the unit)
 */
export function convertToNewFormat(oldIngredient: ParsedIngredient): NewIngredientFormat {
  const measurements = [];
  
  if (oldIngredient.amount && oldIngredient.unit) {
    // Determine system based on unit
    let system: MeasurementSystem;
    const unit = oldIngredient.unit.toLowerCase();
    
    // Imperial units
    if (['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
         'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'fl oz'].includes(unit)) {
      system = MeasurementSystem.IMPERIAL;
    }
    // Metric units
    else if (['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'ml', 'milliliter', 'milliliters',
              'l', 'liter', 'liters'].includes(unit)) {
      system = MeasurementSystem.METRIC;
    }
    // Other units (pieces, cloves, etc.)
    else {
      system = MeasurementSystem.OTHER;
    }
    
    measurements.push({
      system,
      amount: oldIngredient.amount,
      unit: oldIngredient.unit,
    });
  }
  
  return {
    name: oldIngredient.name,
    size: null,
    preparation: null,
    notes: oldIngredient.notes,
    groupName: oldIngredient.groupName,
    isOptional: oldIngredient.isOptional,
    displayOrder: oldIngredient.displayOrder,
    measurements,
  };
}

/**
 * Convert new ingredient format to text for display
 * Uses the first available measurement (or specific system if provided)
 */
export function newIngredientToText(
  ingredient: NewIngredientFormat,
  preferredSystem: MeasurementSystem = MeasurementSystem.IMPERIAL
): string {
  let line = '';
  
  // Find preferred measurement or fallback to first available
  const measurement = ingredient.measurements.find(m => m.system === preferredSystem) 
                   || ingredient.measurements[0];
  
  if (measurement) {
    if (measurement.amount) line += `${measurement.amount} `;
    if (measurement.unit) line += `${measurement.unit} `;
  }
  
  if (ingredient.size) line += `${ingredient.size} `;
  line += ingredient.name;
  if (ingredient.preparation) line += `, ${ingredient.preparation}`;
  if (ingredient.notes) line += ` (${ingredient.notes})`;
  if (ingredient.isOptional) line += ' (optional)';
  
  return line.trim();
}

/**
 * Parse ingredients from textarea input
 * Expected format (one per line):
 * - [amount] [unit] [ingredient name] ([notes]) [optional]
 * - Group headers: "For the [group name]:"
 * 
 * Examples:
 * 2 cups flour
 * 1/2 cup sugar (or brown sugar) optional
 * For the sauce:
 * 3 tbsp olive oil
 */
export function parseIngredients(text: string): ParsedIngredient[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const ingredients: ParsedIngredient[] = [];
  let currentGroup: string | null = null;
  let displayOrder = 0;

  for (const line of lines) {
    // Check if it's a group header (e.g., "For the sauce:" or "Sauce:")
    const groupMatch = line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i);
    if (groupMatch) {
      currentGroup = groupMatch[1].trim();
      continue;
    }

    // Check if marked as optional
    const isOptional = /\b(optional|garnish)\b/i.test(line);
    const cleanLine = line.replace(/\s*\(?(optional|garnish)\)?\s*$/i, '').trim();

    // Extract notes in parentheses
    let notes: string | null = null;
    const notesMatch = cleanLine.match(/\(([^)]+)\)/);
    if (notesMatch) {
      notes = notesMatch[1].trim();
    }
    const withoutNotes = cleanLine.replace(/\s*\([^)]+\)\s*/g, ' ').trim();

    // Parse amount, unit, and name
    // Pattern: [amount] [unit] [name]
    const parts = withoutNotes.split(/\s+/);
    
    let amount: string | null = null;
    let unit: string | null = null;
    let name: string = withoutNotes;

    if (parts.length >= 2) {
      // Check if first part looks like an amount (number, fraction, range)
      const firstPart = parts[0];
      if (/^[\d\/\-\.]+$/.test(firstPart) || /^\d+[\/-]\d+$/.test(firstPart)) {
        amount = firstPart;
        
        // Check if second part is a unit
        const secondPart = parts[1].toLowerCase();
        const commonUnits = ['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons', 
                            'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 
                            'kg', 'kilogram', 'kilograms', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
                            'piece', 'pieces', 'whole', 'slice', 'slices', 'clove', 'cloves', 
                            'pinch', 'dash', 'handful', 'can', 'cans', 'package', 'packages'];
        
        if (commonUnits.includes(secondPart)) {
          unit = secondPart;
          name = parts.slice(2).join(' ');
        } else {
          name = parts.slice(1).join(' ');
        }
      }
    }

    ingredients.push({
      amount,
      unit,
      name: name.trim() || line, // fallback to original line if parsing failed
      notes,
      groupName: currentGroup,
      isOptional,
      displayOrder: displayOrder++
    });
  }

  return ingredients;
}

/**
 * Parse steps from textarea input
 * Expected format (one per line):
 * - Step instructions (numbered or not)
 * - Group headers: "For the [group name]:"
 * 
 * Examples:
 * 1. Preheat oven to 350°F
 * Mix flour and sugar
 * For the frosting:
 * Beat butter until fluffy (optional)
 */
export function parseSteps(text: string): ParsedStep[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const steps: ParsedStep[] = [];
  let currentGroup: string | null = null;
  let stepNumber = 1;

  for (const line of lines) {
    // Check if it's a group header
    const groupMatch = line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i);
    if (groupMatch) {
      currentGroup = groupMatch[1].trim();
      stepNumber = 1; // Reset step number for new group
      continue;
    }

    // Check if marked as optional
    const isOptional = /\b(optional|garnish)\b/i.test(line);
    
    // Remove leading numbers/bullets and optional markers
    const instruction = line
      .replace(/^\d+[\.\)]\s*/, '') // Remove "1. " or "1) "
      .replace(/^[-*•]\s*/, '') // Remove bullet points
      .replace(/\s*\(?(optional|garnish)\)?\s*$/i, '') // Remove optional markers
      .trim();

    if (instruction) {
      steps.push({
        stepNumber: stepNumber++,
        instruction,
        groupName: currentGroup,
        isOptional
      });
    }
  }

  return steps;
}

/**
 * Convert structured ingredients back to textarea format
 */
export function ingredientsToText(ingredients: ParsedIngredient[]): string {
  const lines: string[] = [];
  let lastGroup: string | null = null;

  for (const ing of ingredients) {
    // Add group header if changed
    if (ing.groupName !== lastGroup) {
      if (ing.groupName) {
        lines.push(`\nFor the ${ing.groupName}:`);
      }
      lastGroup = ing.groupName;
    }

    // Build ingredient line
    let line = '';
    if (ing.amount) line += `${ing.amount} `;
    if (ing.unit) line += `${ing.unit} `;
    line += ing.name;
    if (ing.notes) line += ` (${ing.notes})`;
    if (ing.isOptional) line += ' (optional)';
    
    lines.push(line.trim());
  }

  return lines.join('\n');
}

/**
 * Convert structured steps back to textarea format
 */
export function stepsToText(steps: ParsedStep[]): string {
  const lines: string[] = [];
  let lastGroup: string | null = null;

  for (const step of steps) {
    // Add group header if changed
    if (step.groupName !== lastGroup) {
      if (step.groupName) {
        lines.push(`\nFor the ${step.groupName}:`);
      }
      lastGroup = step.groupName;
    }

    // Build step line
    let line = step.instruction;
    if (step.isOptional) line += ' (optional)';
    
    lines.push(line);
  }

  return lines.join('\n');
}
