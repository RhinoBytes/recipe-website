// Recipe parsing utilities
// Simplified to handle single measurement system per ingredient

import { RecipeIngredient, RecipeStep } from "@/types/recipe";

/**
 * Parse ingredients from textarea
 * Format: "amount unit name (notes) optional"
 * Groups: "For the sauce:"
 */
export function parseIngredients(text: string): RecipeIngredient[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const ingredients: RecipeIngredient[] = [];
  let currentGroup: string | null = null;
  let displayOrder = 0;

  for (const line of lines) {
    // Check for group header (e.g., "For the sauce:")
    if (line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)) {
      currentGroup = line
        .match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)![1]
        .trim();
      continue;
    }

    // Check if optional
    const isOptional = /\b(optional|garnish)\b/i.test(line);
    const cleanLine = line
      .replace(/\s*\(?(optional|garnish)\)?\s*$/i, "")
      .trim();

    // Extract notes in parentheses
    const notesMatch = cleanLine.match(/\(([^)]+)\)/);
    const notes = notesMatch ? notesMatch[1].trim() : null;
    const withoutNotes = cleanLine.replace(/\s*\([^)]+\)\s*/g, " ").trim();

    // Parse: [amount] [unit] [name]
    const parts = withoutNotes.split(/\s+/);
    let amount: string | null = null;
    let unit: string | null = null;
    let name = withoutNotes;

    // Common units to check for
    const commonUnits = [
      "cup",
      "cups",
      "tbsp",
      "tablespoon",
      "tablespoons",
      "tsp",
      "teaspoon",
      "teaspoons",
      "oz",
      "ounce",
      "ounces",
      "lb",
      "pound",
      "pounds",
      "fl oz",
      "ml",
      "milliliter",
      "milliliters",
      "l",
      "liter",
      "liters",
      "g",
      "gram",
      "grams",
      "kg",
      "kilogram",
      "kilograms",
      "clove",
      "cloves",
      "pinch",
      "dash",
      "piece",
      "pieces",
      "slice",
      "slices",
    ];

    if (parts.length >= 2 && /^[\d\/\-\.]+$/.test(parts[0])) {
      amount = parts[0];

      // Check if second part is a unit
      if (commonUnits.includes(parts[1].toLowerCase())) {
        unit = parts[1];
        name = parts.slice(2).join(" ");
      } else {
        name = parts.slice(1).join(" ");
      }
    }

    ingredients.push({
      name: name.trim() || line,
      amount,
      unit,
      size: null,
      preparation: null,
      notes,
      groupName: currentGroup,
      isOptional,
      displayOrder: displayOrder++,
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
  const lines = text.split("\n").filter((l) => l.trim());
  const steps: RecipeStep[] = [];
  let currentGroup: string | null = null;
  let stepNumber = 1;

  for (const line of lines) {
    // Check for group header
    if (line.match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)) {
      currentGroup = line
        .match(/^(?:for\s+)?(?:the\s+)?(.+?):\s*$/i)![1]
        .trim();
      stepNumber = 1;
      continue;
    }

    const isOptional = /\b(optional|garnish)\b/i.test(line);
    const instruction = line
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/^[-*•]\s*/, "")
      .replace(/\s*\(?(optional|garnish)\)?\s*$/i, "")
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
 */
export function ingredientsToText(ingredients: RecipeIngredient[]): string {
  const lines: string[] = [];
  let lastGroup: string | null = null;

  for (const ing of ingredients) {
    const currentGroupName = ing.groupName ?? null;
    if (currentGroupName !== lastGroup) {
      if (currentGroupName) {
        lines.push(`\nFor the ${currentGroupName}:`);
      }
      lastGroup = currentGroupName;
    }

    let line = "";
    if (ing.amount && ing.unit) {
      line += `${ing.amount} ${ing.unit} `;
    } else if (ing.amount) {
      line += `${ing.amount} `;
    }
    line += ing.name;
    if (ing.notes) line += ` (${ing.notes})`;
    if (ing.isOptional) line += " (optional)";

    lines.push(line.trim());
  }

  return lines.join("\n");
}

/**
 * Convert steps array back to textarea format
 */
export function stepsToText(steps: RecipeStep[]): string {
  const lines: string[] = [];
  let lastGroup: string | null = null;

  for (const step of steps) {
    const currentGroupName = step.groupName ?? null;
    if (currentGroupName !== lastGroup) {
      if (currentGroupName) {
        lines.push(`\nFor the ${currentGroupName}:`);
      }
      lastGroup = currentGroupName;
    }

    let line = step.instruction;
    if (step.isOptional) line += " (optional)";
    lines.push(line);
  }

  return lines.join("\n");
}
