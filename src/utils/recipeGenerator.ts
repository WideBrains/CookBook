import { MacroTargets, Ingredient, Recipe, RecipeIngredient, RecipeGenerationResult } from '@/types/recipe';

interface GenerationConstraints {
  macroTargets: MacroTargets;
  availableIngredients: Ingredient[];
  availableEquipment: string[];
}

export function generateRecipe(constraints: GenerationConstraints): RecipeGenerationResult {
  const { macroTargets, availableIngredients, availableEquipment } = constraints;

  // Filter ingredients by equipment compatibility
  const compatibleIngredients = availableIngredients.filter(ing => {
    if (ing.equipmentNeeded.length === 0) return true;
    return ing.equipmentNeeded.some(eq => availableEquipment.includes(eq));
  });

  // Separate ingredients by category
  const proteins = compatibleIngredients.filter(i => i.category === 'protein');
  const carbs = compatibleIngredients.filter(i => i.category === 'carbs');
  const vegetables = compatibleIngredients.filter(i => i.category === 'vegetables');
  const fats = compatibleIngredients.filter(i => i.category === 'fats');

  if (proteins.length === 0 || carbs.length === 0) {
    throw new Error('Need at least one protein and one carb source');
  }

  // Select primary ingredients (random for variety)
  const primaryProtein = proteins[Math.floor(Math.random() * proteins.length)];
  const primaryCarb = carbs[Math.floor(Math.random() * carbs.length)];
  const primaryVeg = vegetables.length > 0 
    ? vegetables[Math.floor(Math.random() * vegetables.length)] 
    : null;
  const primaryFat = fats.length > 0 
    ? fats[Math.floor(Math.random() * fats.length)] 
    : null;

  // Calculate quantities needed (using optimization algorithm)
  const result = optimizeIngredientQuantities({
    protein: primaryProtein,
    carb: primaryCarb,
    vegetable: primaryVeg,
    fat: primaryFat,
  }, macroTargets);

  const recipeIngredients = result.ingredients;

  // Calculate actual macros
  const actualMacros = calculateMacros(recipeIngredients);

  // Generate cooking instructions
  const instructions = generateInstructions(recipeIngredients, availableEquipment, macroTargets.mealType);

  // Generate recipe title
  const title = generateTitle(recipeIngredients, macroTargets.mealType);

  // Estimate cooking time
  const cookingTime = estimateCookingTime(recipeIngredients);

  // Determine equipment needed
  const equipmentNeeded = determineEquipment(recipeIngredients);

  // Generate explanation
  const explanation = generateExplanation(macroTargets, actualMacros, recipeIngredients);

  const recipe: Recipe = {
    title,
    ingredients: recipeIngredients,
    instructions,
    macros: actualMacros,
    cookingTime,
    equipment: equipmentNeeded,
    explanation,
  };

  // Determine target match quality
  const targetMatch = {
    protein: getMatchQuality(actualMacros.protein, macroTargets.protein),
    carbs: getMatchQuality(actualMacros.carbs, macroTargets.carbs),
    fats: getMatchQuality(actualMacros.fats, macroTargets.fats),
  };

  return { recipe, targetMatch };
}

function optimizeIngredientQuantities(
  selected: {
    protein: Ingredient;
    carb: Ingredient;
    vegetable: Ingredient | null;
    fat: Ingredient | null;
  },
  targets: MacroTargets
): { ingredients: RecipeIngredient[] } {
  const ingredients: RecipeIngredient[] = [];

  // Start with protein calculation
  let proteinQuantity = (targets.protein / selected.protein.proteinPer100g) * 100;
  
  // Adjust for protein from other sources
  let proteinFromOthers = 0;
  if (selected.carb) proteinFromOthers += (selected.carb.proteinPer100g / 100) * 200; // assume 200g carb
  
  proteinQuantity = Math.max(100, ((targets.protein - proteinFromOthers) / selected.protein.proteinPer100g) * 100);
  proteinQuantity = Math.round(proteinQuantity / 10) * 10; // Round to nearest 10g

  ingredients.push({
    ingredient: selected.protein,
    quantity: proteinQuantity,
  });

  // Calculate carbs needed
  const carbsFromProtein = (proteinQuantity / 100) * selected.protein.carbsPer100g;
  const carbsNeeded = targets.carbs - carbsFromProtein;
  let carbQuantity = (carbsNeeded / selected.carb.carbsPer100g) * 100;
  carbQuantity = Math.max(50, Math.round(carbQuantity / 10) * 10);

  ingredients.push({
    ingredient: selected.carb,
    quantity: carbQuantity,
  });

  // Add vegetable (standard portion)
  if (selected.vegetable) {
    ingredients.push({
      ingredient: selected.vegetable,
      quantity: 150, // Standard veggie portion
    });
  }

  // Calculate fats needed
  const currentFats = ingredients.reduce((sum, ri) => 
    sum + (ri.quantity / 100) * ri.ingredient.fatsPer100g, 0
  );
  const fatsNeeded = targets.fats - currentFats;

  if (selected.fat && fatsNeeded > 5) {
    let fatQuantity = (fatsNeeded / selected.fat.fatsPer100g) * 100;
    fatQuantity = Math.max(10, Math.round(fatQuantity));
    
    ingredients.push({
      ingredient: selected.fat,
      quantity: fatQuantity,
    });
  }

  return { ingredients };
}

function calculateMacros(ingredients: RecipeIngredient[]) {
  let protein = 0;
  let carbs = 0;
  let fats = 0;
  let calories = 0;

  ingredients.forEach(ri => {
    const multiplier = ri.quantity / 100;
    protein += ri.ingredient.proteinPer100g * multiplier;
    carbs += ri.ingredient.carbsPer100g * multiplier;
    fats += ri.ingredient.fatsPer100g * multiplier;
    calories += ri.ingredient.caloriesPer100g * multiplier;
  });

  return {
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
    calories: Math.round(calories),
  };
}

function generateInstructions(
  ingredients: RecipeIngredient[], 
  equipment: string[], 
  mealType: string
): string[] {
  const instructions: string[] = [];
  const proteinItem = ingredients.find(ri => ri.ingredient.category === 'protein');
  const carbItem = ingredients.find(ri => ri.ingredient.category === 'carbs');
  const vegItem = ingredients.find(ri => ri.ingredient.category === 'vegetables');
  const fatItem = ingredients.find(ri => ri.ingredient.category === 'fats');

  // Prep instruction
  instructions.push('Gather all ingredients and prepare your cooking area.');

  // Protein cooking
  if (proteinItem) {
    const ing = proteinItem.ingredient;
    if (equipment.includes('oven') && ing.cookingMethods.includes('bake')) {
      instructions.push(`Preheat oven to 400°F (200°C). Season ${ing.name.toLowerCase()} and bake for 20-25 minutes until fully cooked.`);
    } else if (equipment.includes('stove') && ing.cookingMethods.includes('pan-fry')) {
      instructions.push(`Heat a pan over medium-high heat. Cook ${ing.name.toLowerCase()} for 6-8 minutes per side until golden and cooked through.`);
    } else if (equipment.includes('air-fryer') && ing.cookingMethods.includes('air-fry')) {
      instructions.push(`Preheat air fryer to 380°F (195°C). Cook ${ing.name.toLowerCase()} for 12-15 minutes, flipping halfway.`);
    } else if (ing.cookingMethods.includes('none')) {
      instructions.push(`Portion out ${proteinItem.quantity}g of ${ing.name.toLowerCase()}.`);
    } else {
      instructions.push(`Cook ${ing.name.toLowerCase()} according to your preferred method until done.`);
    }
  }

  // Carb preparation
  if (carbItem) {
    const ing = carbItem.ingredient;
    if (ing.cookingMethods.includes('boil')) {
      instructions.push(`Bring water to boil and cook ${ing.name.toLowerCase()} according to package directions (typically 10-15 minutes).`);
    } else if (ing.cookingMethods.includes('bake') && equipment.includes('oven')) {
      instructions.push(`Bake ${ing.name.toLowerCase()} in the oven at 400°F for 30-40 minutes until tender.`);
    } else if (ing.cookingMethods.includes('microwave') && equipment.includes('microwave')) {
      instructions.push(`Prepare ${ing.name.toLowerCase()} in microwave according to instructions.`);
    } else if (ing.cookingMethods.includes('none')) {
      instructions.push(`Measure out ${carbItem.quantity}g of ${ing.name.toLowerCase()}.`);
    }
  }

  // Vegetable preparation
  if (vegItem) {
    const ing = vegItem.ingredient;
    if (ing.cookingMethods.includes('sauté') && equipment.includes('stove')) {
      instructions.push(`Sauté ${ing.name.toLowerCase()} in a pan over medium heat for 5-7 minutes until tender.`);
    } else if (ing.cookingMethods.includes('roast') && equipment.includes('oven')) {
      instructions.push(`Roast ${ing.name.toLowerCase()} alongside your protein at 400°F for 20 minutes.`);
    } else if (ing.cookingMethods.includes('steam')) {
      instructions.push(`Steam ${ing.name.toLowerCase()} for 5-8 minutes until tender-crisp.`);
    } else if (ing.cookingMethods.includes('raw')) {
      instructions.push(`Wash and prepare ${ing.name.toLowerCase()} as desired.`);
    }
  }

  // Fat addition
  if (fatItem) {
    const ing = fatItem.ingredient;
    if (ing.id === 'olive-oil' || ing.id === 'butter') {
      instructions.push(`Use ${fatItem.quantity}g of ${ing.name.toLowerCase()} for cooking or as dressing.`);
    } else {
      instructions.push(`Add ${fatItem.quantity}g of ${ing.name.toLowerCase()} to your meal.`);
    }
  }

  // Final plating
  instructions.push('Plate all components together and enjoy your balanced meal!');

  return instructions;
}

function generateTitle(ingredients: RecipeIngredient[], mealType: string): string {
  const proteinItem = ingredients.find(ri => ri.ingredient.category === 'protein');
  const carbItem = ingredients.find(ri => ri.ingredient.category === 'carbs');
  
  const mealPrefix = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  
  if (proteinItem && carbItem) {
    return `${mealPrefix} ${proteinItem.ingredient.name} with ${carbItem.ingredient.name}`;
  } else if (proteinItem) {
    return `${mealPrefix} ${proteinItem.ingredient.name} Bowl`;
  }
  
  return `Custom ${mealPrefix} Recipe`;
}

function estimateCookingTime(ingredients: RecipeIngredient[]): number {
  let maxTime = 15; // Base prep time
  
  ingredients.forEach(ri => {
    const ing = ri.ingredient;
    if (ing.cookingMethods.includes('bake')) maxTime = Math.max(maxTime, 35);
    else if (ing.cookingMethods.includes('grill')) maxTime = Math.max(maxTime, 25);
    else if (ing.cookingMethods.includes('boil')) maxTime = Math.max(maxTime, 20);
    else if (ing.cookingMethods.includes('pan-fry')) maxTime = Math.max(maxTime, 20);
    else if (ing.cookingMethods.includes('sauté')) maxTime = Math.max(maxTime, 15);
  });
  
  return maxTime;
}

function determineEquipment(ingredients: RecipeIngredient[]): string[] {
  const equipment = new Set<string>();
  
  ingredients.forEach(ri => {
    ri.ingredient.equipmentNeeded.forEach(eq => equipment.add(eq));
  });
  
  return Array.from(equipment);
}

function generateExplanation(
  targets: MacroTargets, 
  actual: { protein: number; carbs: number; fats: number; calories: number },
  ingredients: RecipeIngredient[]
): string {
  const parts: string[] = [];
  
  parts.push(`This ${targets.mealType} recipe was generated to match your macro targets.`);
  
  const proteinDiff = Math.abs(actual.protein - targets.protein);
  const carbsDiff = Math.abs(actual.carbs - targets.carbs);
  const fatsDiff = Math.abs(actual.fats - targets.fats);
  
  if (proteinDiff <= 10 && carbsDiff <= 10 && fatsDiff <= 10) {
    parts.push('All macros are within 10g of your targets - excellent match!');
  } else if (proteinDiff <= 20 && carbsDiff <= 20 && fatsDiff <= 20) {
    parts.push('Macros are within 20g of your targets - good match!');
  } else {
    parts.push('This is the closest match possible with your available ingredients.');
  }
  
  const mainProtein = ingredients.find(ri => ri.ingredient.category === 'protein');
  if (mainProtein) {
    parts.push(`${mainProtein.ingredient.name} provides the primary protein source.`);
  }
  
  return parts.join(' ');
}

function getMatchQuality(actual: number, target: number): 'good' | 'fair' | 'poor' {
  const diff = Math.abs(actual - target);
  if (diff <= 10) return 'good';
  if (diff <= 20) return 'fair';
  return 'poor';
}
