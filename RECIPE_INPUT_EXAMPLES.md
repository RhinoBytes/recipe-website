# Recipe Input Feature - Usage Examples

## Example 1: Simple Recipe

### User Input (Ingredients Textarea):
```
2 cups flour
1 cup sugar
3 eggs
1/2 cup butter
1 tsp vanilla
```

### User Input (Steps Textarea):
```
Mix flour and sugar
Add eggs one at a time
Add melted butter
Stir in vanilla
Bake at 350°F for 30 minutes
```

### Parsed Result (saved to database):
**Ingredients:**
```json
[
  {"amount": "2", "unit": "cups", "name": "flour", "notes": null, "groupName": null, "isOptional": false, "displayOrder": 0},
  {"amount": "1", "unit": "cup", "name": "sugar", "notes": null, "groupName": null, "isOptional": false, "displayOrder": 1},
  {"amount": "3", "unit": null, "name": "eggs", "notes": null, "groupName": null, "isOptional": false, "displayOrder": 2},
  {"amount": "1/2", "unit": "cup", "name": "butter", "notes": null, "groupName": null, "isOptional": false, "displayOrder": 3},
  {"amount": "1", "unit": "tsp", "name": "vanilla", "notes": null, "groupName": null, "isOptional": false, "displayOrder": 4}
]
```

**Steps:**
```json
[
  {"stepNumber": 1, "instruction": "Mix flour and sugar", "groupName": null, "isOptional": false},
  {"stepNumber": 2, "instruction": "Add eggs one at a time", "groupName": null, "isOptional": false},
  {"stepNumber": 3, "instruction": "Add melted butter", "groupName": null, "isOptional": false},
  {"stepNumber": 4, "instruction": "Stir in vanilla", "groupName": null, "isOptional": false},
  {"stepNumber": 5, "instruction": "Bake at 350°F for 30 minutes", "groupName": null, "isOptional": false}
]
```

## Example 2: Complex Recipe with Groups

### User Input (Ingredients Textarea):
```
For the cake:
2 cups flour
1 cup sugar
3 eggs
1/2 cup milk (or almond milk)
1 tsp baking powder

For the frosting:
1/2 cup butter
2 cups powdered sugar
2 tbsp milk
1 tsp vanilla extract (optional)
```

### User Input (Steps Textarea):
```
For the cake:
Preheat oven to 350°F
Mix dry ingredients in a bowl
Add eggs and milk
Pour into greased pan
Bake for 25-30 minutes

For the frosting:
Beat butter until fluffy
Gradually add powdered sugar
Add milk and vanilla
Spread on cooled cake
```

### Parsed Result:
**Ingredients:**
- 5 ingredients with groupName: "cake"
- 4 ingredients with groupName: "frosting"
- Last frosting ingredient marked as `isOptional: true`
- Second cake ingredient has notes: "or almond milk"

**Steps:**
- Steps 1-5 with groupName: "cake", stepNumber 1-5
- Steps 6-9 with groupName: "frosting", stepNumber 1-4 (renumbered within group)

## Example 3: AI Formatter Flow

### User Action:
1. Click "Use AI Formatter"
2. Paste recipe text from any source

### AI Response:
The AI returns structured data with ingredients and steps arrays

### Frontend Action:
```javascript
// Convert AI structured data to textarea format
setIngredientsText(ingredientsToText(aiIngredients));
setStepsText(stepsToText(aiSteps));
```

### User Can Then:
- Review the populated textareas
- Edit as needed
- Submit the form

### On Submit:
```javascript
// Parse textareas back to structured data
const parsedIngredients = parseIngredients(ingredientsText);
const parsedSteps = parseSteps(stepsText);

// Send structured data to backend
await fetch("/api/recipes", {
  method: "POST",
  body: JSON.stringify({
    ...formData,
    ingredients: parsedIngredients,
    steps: parsedSteps
  })
});
```

## Key Benefits Demonstrated

### 1. Speed
- Old way: Add 10 ingredients = 10 clicks + 30+ field inputs
- New way: Paste 10 lines, submit

### 2. Flexibility
- Copy from any source (websites, books, notes)
- No need to break down into individual fields
- Natural writing style

### 3. AI Integration
- AI provides structured data
- Frontend converts to editable text
- User can review/modify easily
- Submit converts back to structured data

### 4. Data Quality
- Backend only stores structured data
- No raw text in database
- Consistent data model maintained
- Easy to query and filter

## Edge Cases Handled

### Missing Units
Input: `3 eggs`
Parsed: `{amount: "3", unit: null, name: "eggs"}`

### Ranges
Input: `2-3 cups flour`
Parsed: `{amount: "2-3", unit: "cups", name: "flour"}`

### Fractions
Input: `1/2 cup sugar`
Parsed: `{amount: "1/2", unit: "cup", name: "sugar"}`

### Complex Names
Input: `2 cups fresh or frozen blueberries`
Parsed: `{amount: "2", unit: "cups", name: "fresh or frozen blueberries"}`

### Multiple Parentheses
Input: `1 cup sugar (white or brown) (optional)`
Parsed: `{amount: "1", unit: "cup", name: "sugar", notes: "white or brown", isOptional: true}`

### Numbered Steps
Input: `1. Preheat oven\n2. Mix ingredients`
Parsed: Two steps with stepNumber 1 and 2, numbers removed from instruction text
