# Recipe Input Format Guide

This document explains the new textarea-based input format for ingredients and steps in the recipe creation form.

## Overview

The recipe creation form now uses textarea inputs for ingredients and steps, making it easier to paste recipes from other sources or quickly enter multiple items. The backend automatically parses these textareas into structured data before saving.

## Ingredients Format

Enter one ingredient per line in the format: `[amount] [unit] [name] ([notes]) [optional]`

### Basic Examples

```
2 cups all-purpose flour
1/2 cup sugar
1 tsp baking powder
3 tbsp olive oil
2 cloves garlic, minced
```

### With Optional Notes

Add notes in parentheses:

```
2 cups flour (or substitute almond flour)
1/2 cup milk (whole or 2%)
1 tsp vanilla extract (optional)
```

### Grouping Ingredients

Group related ingredients together by adding a group header:

```
For the cake:
2 cups flour
1 cup sugar
3 eggs

For the frosting:
1/2 cup butter
2 cups powdered sugar
2 tbsp milk
```

### Marking Items as Optional

Add `(optional)` at the end of the line:

```
2 tbsp fresh parsley, chopped (optional)
1 tsp red pepper flakes (optional)
```

### Supported Units

The parser recognizes common units like:
- Volume: cup, cups, tbsp, tablespoon, tsp, teaspoon, ml, l, fl oz, pint, quart, gallon
- Weight: oz, ounce, lb, pound, g, gram, kg, kilogram
- Count: piece, pieces, whole, slice, slices, clove, cloves
- Other: pinch, dash, handful, can, cans, package, packages

Units are stored as lowercase strings, so you can use any variation (e.g., "Cup", "CUPS", "cups" all work).

## Steps Format

Enter one step per line. Steps will be automatically numbered.

### Basic Examples

```
Preheat oven to 350°F
Mix flour and sugar in a large bowl
Add eggs one at a time
Bake for 25-30 minutes
```

### With Numbered Steps

You can include numbers, but they'll be renumbered automatically:

```
1. Preheat oven to 350°F
2. Mix dry ingredients
3. Combine wet ingredients
4. Fold wet into dry
```

### Grouping Steps

Group related steps together:

```
For the cake:
Preheat oven to 350°F
Mix flour, sugar, and baking powder
Add eggs and milk

For the frosting:
Beat butter until fluffy
Gradually add powdered sugar
Add milk and vanilla
```

### Optional Steps

Mark steps as optional by adding `(optional)` at the end:

```
Heat oil in a large pan
Add garlic and sauté for 1 minute
Garnish with fresh herbs (optional)
```

## How It Works

1. **User Input**: You enter ingredients and steps in plain text format in the textareas
2. **Parsing**: When you submit the form, the frontend parses the text into structured objects
3. **Validation**: The system validates that you have at least one ingredient and one step
4. **Storage**: Only structured data is saved to the database (no raw text is stored)

## AI Formatter Integration

The AI Formatter can populate the textareas automatically:
1. Click "Use AI Formatter"
2. Paste or type your recipe text
3. The AI will format it and populate both textareas
4. Review and edit as needed before submitting

## Benefits

- **Quick Entry**: Copy/paste recipes from anywhere
- **Flexible Format**: No strict format requirements
- **Automatic Parsing**: The system handles the conversion to structured data
- **Grouping Support**: Organize complex recipes with multiple sections
- **Optional Items**: Easily mark ingredients or steps as optional

## Tips

- Each line becomes one ingredient or step
- Blank lines are ignored (use them for readability)
- Group headers end with a colon (`:`)
- The parser is forgiving - if it can't parse an amount or unit, it will treat the entire line as the item name
- Units are stored as entered (lowercase), so you can use any unit, not just predefined ones
