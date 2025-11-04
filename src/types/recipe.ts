export interface MacroTargets {
  protein: number;
  carbs: number;
  fats: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'protein' | 'carbs' | 'vegetables' | 'fats' | 'seasonings';
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  caloriesPer100g: number;
  cookingMethods: string[];
  equipmentNeeded: string[];
}

export interface Equipment {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  ingredient: Ingredient;
  quantity: number; // in grams
}

export interface Recipe {
  title: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  cookingTime: number; // in minutes
  equipment: string[];
  explanation: string;
}

export interface RecipeGenerationResult {
  recipe: Recipe;
  targetMatch: {
    protein: 'good' | 'fair' | 'poor';
    carbs: 'good' | 'fair' | 'poor';
    fats: 'good' | 'fair' | 'poor';
  };
}
