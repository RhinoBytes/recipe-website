"use client";

import { useState, useMemo } from "react";
import { ListCheck } from "lucide-react";

interface Ingredient {
  id: string;
  amount: string | null;
  unit: string | null;
  name: string;
  notes: string | null;
  groupName: string | null;
  isOptional: boolean;
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

  // Scale ingredient amount
  const scaleIngredient = (ingredient: Ingredient) => {
    if (!ingredient.amount) return ingredient;
    
    const parsed = parseAmount(ingredient.amount);
    if (!parsed) return ingredient;
    
    const scaledValue = parsed.value * scale;
    const formattedAmount = formatAmount(scaledValue);
    
    return {
      ...ingredient,
      amount: formattedAmount
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ListCheck className="text-amber-600" size={28} />
          Ingredients
        </h2>
      </div>

      {/* Scale Controls */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
        <label className="text-sm font-semibold text-gray-700">Scale Recipe:</label>
        <div className="flex gap-2">
          {scaleOptions.map((option) => (
            <button
              key={option}
              onClick={() => setScale(option)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                scale === option
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
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
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {groupName}
              </h3>
            )}
            <ul className="space-y-3">
              {ings.map((ingredient) => {
                const scaledIngredient = scaleIngredient(ingredient);
                const isChecked = checkedItems.has(ingredient.id);
                
                return (
                  <li key={ingredient.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(ingredient.id)}
                      className="mt-1 w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <span
                      className={`flex-1 text-gray-700 transition-all ${
                        isChecked ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {scaledIngredient.amount && (
                        <span className="font-semibold">{scaledIngredient.amount} </span>
                      )}
                      {ingredient.unit && (
                        <span className="font-semibold">
                          {ingredient.unit.toLowerCase().replace(/_/g, ' ')}{' '}
                        </span>
                      )}
                      {ingredient.name}
                      {ingredient.isOptional && (
                        <span className="text-sm text-gray-500 italic"> (optional)</span>
                      )}
                      {ingredient.notes && (
                        <span className="text-sm text-gray-600 block ml-8 mt-1">
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
