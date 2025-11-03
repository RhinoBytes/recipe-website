"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from '@/components/ui/Button';
import { Sparkles, Loader2 } from "lucide-react";
import { FormattedRecipeResponse } from "@/types/recipe";

interface AIRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeFormatted: (formattedData: FormattedRecipeResponse) => void;
}

const MAX_CHARACTERS = 2000;

// Error types for better error handling
enum ErrorType {
  LENGTH_ERROR = 'LENGTH_ERROR',
  SUBMISSION_ERROR = 'SUBMISSION_ERROR',
}

export default function AIRecipeModal({
  isOpen,
  onClose,
  onRecipeFormatted,
}: AIRecipeModalProps) {
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);

  const characterCount = pasteText.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const isDisabled = loading || !pasteText.trim() || isOverLimit;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Enforce hard limit at MAX_CHARACTERS
    if (newText.length <= MAX_CHARACTERS) {
      setPasteText(newText);
    }
    
    // Clear error when user starts typing if it was a length error
    if (errorType === ErrorType.LENGTH_ERROR) {
      setError(null);
      setErrorType(null);
    }
  };

  const handleFormatWithAI = async () => {
    if (!pasteText.trim()) {
      setError("Please paste a recipe first");
      setErrorType(ErrorType.SUBMISSION_ERROR);
      return;
    }

    if (isOverLimit) {
      setError(`Recipe text is too long. Please reduce it to ${MAX_CHARACTERS} characters or less.`);
      setErrorType(ErrorType.LENGTH_ERROR);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const response = await fetch("/api/ai/format-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to format recipe");
      }

      const data = await response.json();
      const formatted = data.recipe || data;

      // Pass the formatted data back to parent
      onRecipeFormatted(formatted);
      
      // Close modal after successful formatting
      setPasteText("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to format recipe");
      setErrorType(ErrorType.SUBMISSION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPasteText("");
      setError(null);
      setErrorType(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Recipe Formatter" size="lg">
      <div className="space-y-4">
        <div>
          <p className="text-gray-700 mb-4">
            Paste your recipe below and let AI format it for you! Include the title,
            ingredients, instructions, and any other details you have.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipe Text
          </label>
          <textarea
            value={pasteText}
            onChange={handleTextChange}
            maxLength={MAX_CHARACTERS}
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4735a] focus:border-transparent resize-none"
            placeholder="Example:

Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup butter
- 1 cup sugar
- 2 eggs
- 1 tsp vanilla
- 2 cups chocolate chips

Instructions:
1. Preheat oven to 350°F
2. Mix butter and sugar
3. Add eggs and vanilla
4. Mix in flour
5. Fold in chocolate chips
6. Bake for 12 minutes

Serves 24 cookies"
            disabled={loading}
          />
          
          {/* Character counter */}
          <div className={`mt-2 text-sm ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {characterCount} / {MAX_CHARACTERS} characters
            {isOverLimit && (
              <span className="ml-2">
                ({characterCount - MAX_CHARACTERS} over limit)
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleFormatWithAI}
            disabled={isDisabled}
            title={isOverLimit ? "Recipe text exceeds character limit" : undefined}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Formatting...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Format Recipe
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
