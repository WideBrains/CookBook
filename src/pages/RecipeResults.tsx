import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { INGREDIENTS } from '@/data/ingredients';
import { solveLP, solveMILP, solveGenetic, solveGreedy, OptimizationModel } from '@/utils/optimizationModels';
import { ArrowLeft, RefreshCw, Clock, ChefHat, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { MacroTargets } from '@/types/recipe';

export default function RecipeResults() {
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    generateRecipe();

    return () => subscription.unsubscribe();
  }, []);

  const generateRecipe = async () => {
    setIsLoading(true);
    try {
      const macroTargets: MacroTargets = JSON.parse(sessionStorage.getItem('macroTargets') || '{}');
      const selectedIngredientIds = JSON.parse(sessionStorage.getItem('selectedIngredients') || '[]');
      const selectedEquipment = JSON.parse(sessionStorage.getItem('selectedEquipment') || '[]');
      const optimizationModel = (sessionStorage.getItem('optimizationModel') || 'lp') as OptimizationModel;

      if (!macroTargets.protein) {
        navigate('/macro-input');
        return;
      }

      const availableIngredients = INGREDIENTS.filter(ing => 
        selectedIngredientIds.includes(ing.id)
      );

      // Select optimization model
      let result;
      switch (optimizationModel) {
        case 'milp':
          result = solveMILP(macroTargets, availableIngredients);
          break;
        case 'genetic':
          result = solveGenetic(macroTargets, availableIngredients);
          break;
        case 'greedy':
          result = solveGreedy(macroTargets, availableIngredients);
          break;
        default:
          result = solveLP(macroTargets, availableIngredients);
      }

      if (!result.feasible) {
        toast.error('Could not generate a feasible recipe with the selected ingredients');
        navigate('/inventory');
        return;
      }

      // Generate recipe details
      const recipeTitle = generateTitle(result.ingredients, macroTargets.mealType);
      const instructions = generateInstructions(result.ingredients, selectedEquipment, macroTargets.mealType);
      const cookingTime = estimateCookingTime(result.ingredients);
      const explanation = generateExplanation(macroTargets, result.macros, result.ingredients);

      const recipeData = {
        title: recipeTitle,
        ingredients: result.ingredients,
        instructions,
        macros: result.macros,
        cookingTime,
        equipment: selectedEquipment,
        explanation,
        optimizationModel,
        solveTimeMs: result.solveTimeMs,
        objectiveValue: result.objectiveValue
      };

      setRecipe(recipeData);
      toast.success(`Recipe generated in ${result.solveTimeMs.toFixed(0)}ms using ${optimizationModel.toUpperCase()}`);

      // Save to research_runs if needed
      if (user) {
        await saveResearchRun(macroTargets, availableIngredients, selectedEquipment, optimizationModel, result, recipeData);
      }
    } catch (error) {
      console.error('Recipe generation error:', error);
      toast.error('Failed to generate recipe');
      navigate('/inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const saveResearchRun = async (targets: MacroTargets, ingredients: any[], equipment: string[], model: string, result: any, recipeData: any) => {
    try {
      const macroAccuracy = {
        proteinError: Math.abs(result.macros.protein - targets.protein),
        carbsError: Math.abs(result.macros.carbs - targets.carbs),
        fatsError: Math.abs(result.macros.fats - targets.fats)
      };

      await supabase.from('research_runs').insert([{
        macro_targets: targets as any,
        available_ingredients: ingredients.map(i => i.id) as any,
        available_equipment: equipment as any,
        model_type: model,
        solve_time_ms: Math.round(result.solveTimeMs),
        recipe_result: recipeData as any,
        macro_accuracy: macroAccuracy as any,
        feasibility_status: result.feasible ? 'feasible' : 'infeasible'
      }]);
    } catch (error) {
      console.error('Failed to save research run:', error);
    }
  };

  const saveRecipe = async () => {
    if (!user) {
      toast.error('Please sign in to save recipes');
      navigate('/auth');
      return;
    }

    if (!recipe) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('saved_recipes').insert([{
        user_id: user.id,
        title: recipe.title,
        ingredients: recipe.ingredients as any,
        instructions: recipe.instructions as any,
        macros: recipe.macros as any,
        cooking_time: recipe.cookingTime,
        equipment: recipe.equipment as any,
        explanation: recipe.explanation,
        optimization_model: recipe.optimizationModel
      }]);

      if (error) throw error;
      toast.success('Recipe saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save recipe');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getMatchQuality = (actual: number, target: number): 'good' | 'fair' | 'poor' => {
    const diff = Math.abs(actual - target);
    const tolerance = target * 0.1; // 10% tolerance
    if (diff <= tolerance) return 'good';
    if (diff <= tolerance * 2) return 'fair';
    return 'poor';
  };

  if (isLoading || !recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Generating your perfect recipe...</p>
        </div>
      </div>
    );
  }

  const macroTargets: MacroTargets = JSON.parse(sessionStorage.getItem('macroTargets') || '{}');
  
  const getMatchIcon = (quality: string) => {
    if (quality === 'good') return <CheckCircle2 className="w-5 h-5 text-success" />;
    if (quality === 'fair') return <AlertCircle className="w-5 h-5 text-warning" />;
    return <AlertCircle className="w-5 h-5 text-destructive" />;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <ProgressIndicator currentStep={3} totalSteps={3} steps={['Macros', 'Inventory', 'Model']} />

        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground mb-2">{recipe.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.cookingTime} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  <span>{recipe.equipment.length} equipment items</span>
                </div>
                <Badge variant="secondary">{recipe.optimizationModel?.toUpperCase()}</Badge>
              </div>
            </div>
            {user && (
              <Button onClick={saveRecipe} disabled={isSaving}>
                <Save className="mr-2 w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Recipe'}
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                    <span className="font-medium text-foreground">{item.ingredient.name}</span>
                    <span className="text-muted-foreground">{item.quantity}g</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Equipment Needed</h3>
              <ul className="space-y-2">
                {recipe.equipment.map((item: string, idx: number) => (
                  <li key={idx} className="p-3 bg-secondary/30 rounded-lg text-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Instructions</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction: string, idx: number) => (
                <li key={idx} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {idx + 1}
                  </span>
                  <p className="flex-1 pt-1 text-foreground">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Nutritional Information</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-foreground">Nutrient</th>
                    <th className="text-right py-3 text-foreground">Target</th>
                    <th className="text-right py-3 text-foreground">Actual</th>
                    <th className="text-center py-3 text-foreground">Match</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 text-foreground font-medium">Protein</td>
                    <td className="text-right py-3 text-muted-foreground">{macroTargets.protein}g</td>
                    <td className="text-right py-3 text-foreground font-semibold">{recipe.macros.protein.toFixed(1)}g</td>
                    <td className="text-center py-3">
                      {getMatchIcon(getMatchQuality(recipe.macros.protein, macroTargets.protein))}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-foreground font-medium">Carbohydrates</td>
                    <td className="text-right py-3 text-muted-foreground">{macroTargets.carbs}g</td>
                    <td className="text-right py-3 text-foreground font-semibold">{recipe.macros.carbs.toFixed(1)}g</td>
                    <td className="text-center py-3">
                      {getMatchIcon(getMatchQuality(recipe.macros.carbs, macroTargets.carbs))}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-foreground font-medium">Fats</td>
                    <td className="text-right py-3 text-muted-foreground">{macroTargets.fats}g</td>
                    <td className="text-right py-3 text-foreground font-semibold">{recipe.macros.fats.toFixed(1)}g</td>
                    <td className="text-center py-3">
                      {getMatchIcon(getMatchQuality(recipe.macros.fats, macroTargets.fats))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-foreground font-medium">Total Calories</td>
                    <td className="text-right py-3 text-muted-foreground">~{(macroTargets.protein * 4 + macroTargets.carbs * 4 + macroTargets.fats * 9).toFixed(0)}</td>
                    <td className="text-right py-3 text-foreground font-semibold">{recipe.macros.calories.toFixed(0)}</td>
                    <td className="text-center py-3">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="font-semibold mb-2 text-foreground">Why This Recipe?</h4>
            <p className="text-muted-foreground">{recipe.explanation}</p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/inventory')}
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={generateRecipe}
          >
            <RefreshCw className="mr-2 w-5 h-5" />
            Try Another
          </Button>
          <Button
            size="lg"
            onClick={() => navigate('/macro-input')}
          >
            Adjust Macros
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function generateTitle(ingredients: any[], mealType: string): string {
  const protein = ingredients.find(i => i.ingredient.category === 'protein');
  const carb = ingredients.find(i => i.ingredient.category === 'carbs');
  
  const mealPrefix = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  return `${mealPrefix} ${protein?.ingredient.name || 'Protein'} with ${carb?.ingredient.name || 'Carbs'}`;
}

function generateInstructions(ingredients: any[], equipment: string[], mealType: string): string[] {
  const instructions: string[] = [];
  const protein = ingredients.find(i => i.ingredient.category === 'protein');
  const carb = ingredients.find(i => i.ingredient.category === 'carbs');
  const veg = ingredients.find(i => i.ingredient.category === 'vegetables');
  
  instructions.push(`Gather all ingredients: ${ingredients.map(i => `${i.quantity}g ${i.ingredient.name}`).join(', ')}`);
  
  if (protein) {
    instructions.push(`Prepare ${protein.ingredient.name} using your ${equipment[0] || 'cooking equipment'}`);
  }
  
  if (carb) {
    instructions.push(`Cook ${carb.ingredient.name} according to package instructions`);
  }
  
  if (veg) {
    instructions.push(`Prepare ${veg.ingredient.name} by washing and cutting as needed`);
  }
  
  instructions.push('Plate all components together and serve immediately');
  
  return instructions;
}

function estimateCookingTime(ingredients: any[]): number {
  return 20 + ingredients.length * 5;
}

function generateExplanation(targets: MacroTargets, actual: any, ingredients: any[]): string {
  const protein = ingredients.find(i => i.ingredient.category === 'protein');
  return `This ${targets.mealType} recipe is optimized to match your macro targets. The ${protein?.ingredient.name || 'protein source'} provides quality protein while keeping the meal within your calorie goals. Macros are balanced to support your fitness objectives.`;
}