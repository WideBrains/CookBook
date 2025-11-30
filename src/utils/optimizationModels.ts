import { Ingredient, MacroTargets, RecipeIngredient } from '@/types/recipe';

export type OptimizationModel = 'lp' | 'milp' | 'genetic' | 'greedy';

export interface OptimizationResult {
  ingredients: RecipeIngredient[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  solveTimeMs: number;
  feasible: boolean;
  objectiveValue: number;
}

// Linear Programming - Continuous quantities, fastest
export function solveLP(
  targets: MacroTargets,
  availableIngredients: Ingredient[]
): OptimizationResult {
  const startTime = performance.now();
  
  const protein = availableIngredients.filter(i => i.category === 'protein');
  const carbs = availableIngredients.filter(i => i.category === 'carbs');
  const vegetables = availableIngredients.filter(i => i.category === 'vegetables');
  const fats = availableIngredients.filter(i => i.category === 'fats');

  if (protein.length === 0 || carbs.length === 0) {
    return {
      ingredients: [],
      macros: { protein: 0, carbs: 0, fats: 0, calories: 0 },
      solveTimeMs: performance.now() - startTime,
      feasible: false,
      objectiveValue: Infinity
    };
  }

  // Select best ingredients based on macro density
  const selectedProtein = protein.reduce((a, b) => 
    a.proteinPer100g > b.proteinPer100g ? a : b
  );
  const selectedCarb = carbs.reduce((a, b) => 
    a.carbsPer100g > b.carbsPer100g ? a : b
  );
  const selectedVeg = vegetables.length > 0 ? vegetables[0] : null;
  const selectedFat = fats.length > 0 ? fats[0] : null;

  // Calculate optimal quantities using linear algebra approximation
  const proteinQuantity = Math.max(50, (targets.protein * 100) / selectedProtein.proteinPer100g);
  const carbQuantity = Math.max(50, (targets.carbs * 100) / selectedCarb.carbsPer100g);
  const vegQuantity = selectedVeg ? 100 : 0;
  const fatQuantity = selectedFat ? Math.max(20, (targets.fats * 100) / selectedFat.fatsPer100g) : 0;

  const ingredients: RecipeIngredient[] = [
    { ingredient: selectedProtein, quantity: proteinQuantity },
    { ingredient: selectedCarb, quantity: carbQuantity }
  ];
  
  if (selectedVeg) ingredients.push({ ingredient: selectedVeg, quantity: vegQuantity });
  if (selectedFat) ingredients.push({ ingredient: selectedFat, quantity: fatQuantity });

  const macros = calculateMacros(ingredients);
  const objective = Math.abs(macros.protein - targets.protein) +
                   Math.abs(macros.carbs - targets.carbs) +
                   Math.abs(macros.fats - targets.fats);

  return {
    ingredients,
    macros,
    solveTimeMs: performance.now() - startTime,
    feasible: true,
    objectiveValue: objective
  };
}

// Mixed Integer Linear Programming - Discrete portions (50g increments)
export function solveMILP(
  targets: MacroTargets,
  availableIngredients: Ingredient[]
): OptimizationResult {
  const startTime = performance.now();
  
  const protein = availableIngredients.filter(i => i.category === 'protein');
  const carbs = availableIngredients.filter(i => i.category === 'carbs');
  const vegetables = availableIngredients.filter(i => i.category === 'vegetables');
  const fats = availableIngredients.filter(i => i.category === 'fats');

  if (protein.length === 0 || carbs.length === 0) {
    return {
      ingredients: [],
      macros: { protein: 0, carbs: 0, fats: 0, calories: 0 },
      solveTimeMs: performance.now() - startTime,
      feasible: false,
      objectiveValue: Infinity
    };
  }

  // Integer constraint: portions of 50g
  const portionSize = 50;
  const selectedProtein = protein.reduce((a, b) => 
    a.proteinPer100g > b.proteinPer100g ? a : b
  );
  const selectedCarb = carbs.reduce((a, b) => 
    a.carbsPer100g > b.carbsPer100g ? a : b
  );
  const selectedVeg = vegetables.length > 0 ? vegetables[0] : null;
  const selectedFat = fats.length > 0 ? fats[0] : null;

  // Round to nearest portion
  const proteinPortions = Math.round((targets.protein * 100) / (selectedProtein.proteinPer100g * portionSize));
  const carbPortions = Math.round((targets.carbs * 100) / (selectedCarb.carbsPer100g * portionSize));
  const vegPortions = selectedVeg ? 2 : 0; // 100g = 2 portions
  const fatPortions = selectedFat ? Math.round((targets.fats * 100) / (selectedFat.fatsPer100g * portionSize)) : 0;

  const ingredients: RecipeIngredient[] = [
    { ingredient: selectedProtein, quantity: Math.max(1, proteinPortions) * portionSize },
    { ingredient: selectedCarb, quantity: Math.max(1, carbPortions) * portionSize }
  ];
  
  if (selectedVeg) ingredients.push({ ingredient: selectedVeg, quantity: vegPortions * portionSize });
  if (selectedFat) ingredients.push({ ingredient: selectedFat, quantity: Math.max(1, fatPortions) * portionSize });

  const macros = calculateMacros(ingredients);
  const objective = Math.abs(macros.protein - targets.protein) +
                   Math.abs(macros.carbs - targets.carbs) +
                   Math.abs(macros.fats - targets.fats);

  return {
    ingredients,
    macros,
    solveTimeMs: performance.now() - startTime,
    feasible: true,
    objectiveValue: objective
  };
}

// Genetic Algorithm - Evolutionary approach
export function solveGenetic(
  targets: MacroTargets,
  availableIngredients: Ingredient[]
): OptimizationResult {
  const startTime = performance.now();
  
  const protein = availableIngredients.filter(i => i.category === 'protein');
  const carbs = availableIngredients.filter(i => i.category === 'carbs');
  const vegetables = availableIngredients.filter(i => i.category === 'vegetables');
  const fats = availableIngredients.filter(i => i.category === 'fats');

  if (protein.length === 0 || carbs.length === 0) {
    return {
      ingredients: [],
      macros: { protein: 0, carbs: 0, fats: 0, calories: 0 },
      solveTimeMs: performance.now() - startTime,
      feasible: false,
      objectiveValue: Infinity
    };
  }

  // GA parameters
  const populationSize = 20;
  const generations = 50;
  const mutationRate = 0.2;

  // Initialize population
  let population = Array(populationSize).fill(null).map(() => generateRandomSolution(
    protein, carbs, vegetables, fats
  ));

  // Evolve
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness
    const fitness = population.map(sol => 1 / (1 + calculateFitness(sol, targets)));
    
    // Selection (tournament)
    const newPopulation = [];
    for (let i = 0; i < populationSize; i++) {
      const idx1 = Math.floor(Math.random() * populationSize);
      const idx2 = Math.floor(Math.random() * populationSize);
      newPopulation.push(fitness[idx1] > fitness[idx2] ? population[idx1] : population[idx2]);
    }
    
    // Mutation
    population = newPopulation.map(sol => 
      Math.random() < mutationRate ? mutateSolution(sol, protein, carbs, vegetables, fats) : sol
    );
  }

  // Select best solution
  const bestSolution = population.reduce((best, current) => {
    const bestFit = calculateFitness(best, targets);
    const currentFit = calculateFitness(current, targets);
    return currentFit < bestFit ? current : best;
  });

  const macros = calculateMacros(bestSolution);
  const objective = calculateFitness(bestSolution, targets);

  return {
    ingredients: bestSolution,
    macros,
    solveTimeMs: performance.now() - startTime,
    feasible: true,
    objectiveValue: objective
  };
}

// Greedy Heuristic - Baseline algorithm
export function solveGreedy(
  targets: MacroTargets,
  availableIngredients: Ingredient[]
): OptimizationResult {
  const startTime = performance.now();
  
  const protein = availableIngredients.filter(i => i.category === 'protein');
  const carbs = availableIngredients.filter(i => i.category === 'carbs');
  const vegetables = availableIngredients.filter(i => i.category === 'vegetables');
  const fats = availableIngredients.filter(i => i.category === 'fats');

  if (protein.length === 0 || carbs.length === 0) {
    return {
      ingredients: [],
      macros: { protein: 0, carbs: 0, fats: 0, calories: 0 },
      solveTimeMs: performance.now() - startTime,
      feasible: false,
      objectiveValue: Infinity
    };
  }

  // Greedy: select first available, use simple proportions
  const selectedProtein = protein[0];
  const selectedCarb = carbs[0];
  const selectedVeg = vegetables.length > 0 ? vegetables[0] : null;
  const selectedFat = fats.length > 0 ? fats[0] : null;

  const ingredients: RecipeIngredient[] = [
    { ingredient: selectedProtein, quantity: 150 },
    { ingredient: selectedCarb, quantity: 150 }
  ];
  
  if (selectedVeg) ingredients.push({ ingredient: selectedVeg, quantity: 100 });
  if (selectedFat) ingredients.push({ ingredient: selectedFat, quantity: 20 });

  const macros = calculateMacros(ingredients);
  const objective = Math.abs(macros.protein - targets.protein) +
                   Math.abs(macros.carbs - targets.carbs) +
                   Math.abs(macros.fats - targets.fats);

  return {
    ingredients,
    macros,
    solveTimeMs: performance.now() - startTime,
    feasible: true,
    objectiveValue: objective
  };
}

// Helper functions
function calculateMacros(ingredients: RecipeIngredient[]) {
  let protein = 0, carbs = 0, fats = 0, calories = 0;
  
  ingredients.forEach(({ ingredient, quantity }) => {
    const factor = quantity / 100;
    protein += ingredient.proteinPer100g * factor;
    carbs += ingredient.carbsPer100g * factor;
    fats += ingredient.fatsPer100g * factor;
    calories += ingredient.caloriesPer100g * factor;
  });

  return { protein, carbs, fats, calories };
}

function calculateFitness(solution: RecipeIngredient[], targets: MacroTargets): number {
  const macros = calculateMacros(solution);
  return Math.abs(macros.protein - targets.protein) +
         Math.abs(macros.carbs - targets.carbs) +
         Math.abs(macros.fats - targets.fats);
}

function generateRandomSolution(
  protein: Ingredient[],
  carbs: Ingredient[],
  vegetables: Ingredient[],
  fats: Ingredient[]
): RecipeIngredient[] {
  const solution: RecipeIngredient[] = [
    { ingredient: protein[Math.floor(Math.random() * protein.length)], quantity: 50 + Math.random() * 200 },
    { ingredient: carbs[Math.floor(Math.random() * carbs.length)], quantity: 50 + Math.random() * 200 }
  ];
  
  if (vegetables.length > 0) {
    solution.push({ ingredient: vegetables[Math.floor(Math.random() * vegetables.length)], quantity: 50 + Math.random() * 150 });
  }
  if (fats.length > 0) {
    solution.push({ ingredient: fats[Math.floor(Math.random() * fats.length)], quantity: 10 + Math.random() * 40 });
  }
  
  return solution;
}

function mutateSolution(
  solution: RecipeIngredient[],
  protein: Ingredient[],
  carbs: Ingredient[],
  vegetables: Ingredient[],
  fats: Ingredient[]
): RecipeIngredient[] {
  const mutated = solution.map(ri => ({ ...ri, quantity: ri.quantity }));
  const idx = Math.floor(Math.random() * mutated.length);
  
  if (Math.random() < 0.5) {
    // Mutate quantity
    mutated[idx].quantity = Math.max(10, mutated[idx].quantity + (Math.random() - 0.5) * 50);
  } else {
    // Mutate ingredient
    const category = mutated[idx].ingredient.category;
    let pool: Ingredient[] = [];
    if (category === 'protein') pool = protein;
    else if (category === 'carbs') pool = carbs;
    else if (category === 'vegetables') pool = vegetables;
    else if (category === 'fats') pool = fats;
    
    if (pool.length > 1) {
      mutated[idx].ingredient = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  
  return mutated;
}