"use client";

import { useState, useMemo } from "react";
import { ListCheck } from "lucide-react";
import { MeasurementSystem } from "@prisma/client";

interface IngredientMeasurement {
  system: MeasurementSystem;
  amount: string;
  unit: string;
}

interface Ingredient {
  id: string;
  name: string;
  size: string | null;
  preparation: string | null;
  notes: string | null;
  groupName: string | null;
  isOptional: boolean;
  measurements: IngredientMeasurement[];
}

interface IngredientsListProps {
  ingredients: Ingredient[];
}

// Utility functions for scaling
function parseAmount(amount: string | null): { value: number; fraction: string | null; unit: string | null } | null {
  if (!amount) return null;
  
  // Try to parse fractions like "1/2", "1/3", "1/4", "2/3", "3/4"
  const fractionMatch = amount.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return {
      value: parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]),
      fraction: amount,
      unit: null
    };
  }
  
  // Try to parse mixed numbers like "1 1/2"
  const mixedMatch = amount.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const numerator = parseInt(mixedMatch[2]);
    const denominator = parseInt(mixedMatch[3]);
    return {
      value: whole + (numerator / denominator),
      fraction: `${numerator}/${denominator}`,
      unit: null
    };
  }
  
  // Parse decimal or integer
  const numValue = parseFloat(amount);
  if (!isNaN(numValue)) {
    return {
      value: numValue,
      fraction: null,
      unit: null
    };
  }
  
  return null;
}

function formatAmount(value: number): string {
  // Handle common fractions
  const fractions: { [key: number]: string } = {
    0.125: '⅛',
    0.25: '¼',
    0.333: '⅓',
    0.5: '½',
    0.666: '⅔',
    0.75: '¾',
  };
  
  // Check if it's close to a common fraction
  for (const [decimal, fraction] of Object.entries(fractions)) {
    if (Math.abs(value - parseFloat(decimal)) < 0.01) {
      return fraction;
    }
  }
  
  // Check for mixed numbers
  const whole = Math.floor(value);
  const remainder = value - whole;
  
  if (remainder > 0.01) {
    for (const [decimal, fraction] of Object.entries(fractions)) {
      if (Math.abs(remainder - parseFloat(decimal)) < 0.01) {
        return whole > 0 ? `${whole} ${fraction}` : fraction;
      }
    }
  }
  
  // Return as decimal with 1-2 decimal places
  if (value % 1 === 0) {
    return value.toString();
  }
  return value.toFixed(value < 10 ? 1 : 0);
}

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  const [scale, setScale] = useState(1);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>(MeasurementSystem.IMPERIAL);

  // Group ingredients by groupName
  const groupedIngredients = useMemo(() => {
    const grouped = ingredients.reduce((acc, ing) => {
      const group = ing.groupName || 'Main';
      if (!acc[group]) acc[group] = [];
      acc[group].push(ing);
      return acc;
    }, {} as Record<string, Ingredient[]>);
    
    return grouped;
  }, [ingredients]);

  // Get the measurement for the selected system or fallback
  const getMeasurement = (ingredient: Ingredient): IngredientMeasurement | null => {
    if (!ingredient.measurements || ingredient.measurements.length === 0) return null;
    
    // Try to find measurement for selected system
    const measurement = ingredient.measurements.find(m => m.system === measurementSystem);
    
    // If not found, try OTHER system
    if (!measurement) {
      const otherMeasurement = ingredient.measurements.find(m => m.system === MeasurementSystem.OTHER);
      if (otherMeasurement) return otherMeasurement;
    }
    
    // Fallback to first available measurement
    return measurement || ingredient.measurements[0];
  };

  // Scale ingredient amount
  const scaleIngredient = (ingredient: Ingredient) => {
    const measurement = getMeasurement(ingredient);
    if (!measurement) return null;
    
    const parsed = parseAmount(measurement.amount);
    if (!parsed) return { amount: measurement.amount, unit: measurement.unit };
    
    const scaledValue = parsed.value * scale;
    const formattedAmount = formatAmount(scaledValue);
    
    return {
      amount: formattedAmount,
      unit: measurement.unit
    };
  };

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const scaleOptions = [0.5, 1, 2, 3];
console.log(`ingredients =`, ingredients);
  
  return (
    <div className="bg-bg-secondary rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text flex items-center gap-2">
          <ListCheck className="text-accent" size={28} />
          Ingredients
        </h2>
      </div>

      {/* Measurement System Toggle */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-bg rounded-lg border border-border">
        <label className="text-sm font-semibold text-text">Units:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMeasurementSystem(MeasurementSystem.IMPERIAL)}
            className={`px-4 py-2 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent ${
              measurementSystem === MeasurementSystem.IMPERIAL
                ? 'bg-accent text-bg shadow-md'
                : 'bg-bg-secondary text-text hover:bg-accent-light border border-border'
            }`}
            aria-label="Use imperial units"
            aria-pressed={measurementSystem === MeasurementSystem.IMPERIAL}
          >
            Imperial
          </button>
          <button
            onClick={() => setMeasurementSystem(MeasurementSystem.METRIC)}
            className={`px-4 py-2 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent ${
              measurementSystem === MeasurementSystem.METRIC
                ? 'bg-accent text-bg shadow-md'
                : 'bg-bg-secondary text-text hover:bg-accent-light border border-border'
            }`}
            aria-label="Use metric units"
            aria-pressed={measurementSystem === MeasurementSystem.METRIC}
          >
            Metric
          </button>
        </div>
      </div>

      {/* Scale Controls */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-bg rounded-lg border border-border">
        <label className="text-sm font-semibold text-text">Scale Recipe:</label>
        <div className="flex gap-2">
          {scaleOptions.map((option) => (
            <button
              key={option}
              onClick={() => setScale(option)}
              className={`px-4 py-2 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent ${
                scale === option
                  ? 'bg-accent text-bg shadow-md'
                  : 'bg-bg-secondary text-text hover:bg-accent-light border border-border'
              }`}
              aria-label={`Scale recipe to ${option === 0.5 ? 'half' : option} times`}
              aria-pressed={scale === option}
            >
              {option === 0.5 ? '½' : option}x
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients List */}
      <div className="space-y-6">
        {Object.entries(groupedIngredients).map(([groupName, ings]) => (
          <div key={groupName}>
            {Object.keys(groupedIngredients).length > 1 && (
              <h3 className="text-lg font-semibold text-text mb-3">
                {groupName}
              </h3>
            )}
            <ul className="space-y-3" role="list">
              {ings.map((ingredient) => {
                const scaled = scaleIngredient(ingredient);
                const isChecked = checkedItems.has(ingredient.id);
                
                return (
                  <li key={ingredient.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(ingredient.id)}
                      className="mt-1 w-5 h-5 text-accent rounded border-border focus:ring-accent cursor-pointer"
                      aria-label={`Check off ${ingredient.name}`}
                    />
                    <span
                      className={`flex-1 text-text transition-all ${
                        isChecked ? 'line-through text-text-muted' : ''
                      }`}
                    >
                      {scaled && (
                        <>
                          <span className="font-semibold">{scaled.amount} </span>
                          <span className="font-semibold">
                            {scaled.unit.toLowerCase().replace(/_/g, ' ')}{' '}
                          </span>
                        </>
                      )}
                      {ingredient.size && (
                        <span className="font-semibold">{ingredient.size} </span>
                      )}
                      {ingredient.name}
                      {ingredient.preparation && (
                        <span className="text-text-secondary">, {ingredient.preparation}</span>
                      )}
                      {ingredient.isOptional && (
                        <span className="text-sm text-text-muted italic"> (optional)</span>
                      )}
                      {ingredient.notes && (
                        <span className="text-sm text-text-secondary block ml-8 mt-1">
                          {ingredient.notes}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
