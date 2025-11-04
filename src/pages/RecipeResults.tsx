import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { INGREDIENTS } from '@/data/ingredients';
import { generateRecipe } from '@/utils/recipeGenerator';
import { RecipeGenerationResult } from '@/types/recipe';
import { ArrowLeft, RefreshCw, Clock, ChefHat, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RecipeResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<RecipeGenerationResult | null>(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    generateNewRecipe();
  }, []);

  const generateNewRecipe = () => {
    try {
      const macroTargets = JSON.parse(sessionStorage.getItem('macroTargets') || '{}');
      const selectedIngredientIds = JSON.parse(sessionStorage.getItem('selectedIngredients') || '[]');
      const selectedEquipment = JSON.parse(sessionStorage.getItem('selectedEquipment') || '[]');

      if (!macroTargets.protein) {
        navigate('/');
        return;
      }

      const availableIngredients = INGREDIENTS.filter(ing => 
        selectedIngredientIds.includes(ing.id)
      );

      const newResult = generateRecipe({
        macroTargets,
        availableIngredients,
        availableEquipment: selectedEquipment,
      });

      setResult(newResult);
      toast.success('Recipe generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate recipe');
      navigate('/inventory');
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Generating your perfect recipe...</p>
        </div>
      </div>
    );
  }

  const { recipe, targetMatch } = result;
  const macroTargets = JSON.parse(sessionStorage.getItem('macroTargets') || '{}');

  const getMatchIcon = (quality: string) => {
    if (quality === 'good') return <CheckCircle2 className="w-5 h-5 text-success" />;
    if (quality === 'fair') return <AlertCircle className="w-5 h-5 text-warning" />;
    return <AlertCircle className="w-5 h-5 text-destructive" />;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <ProgressIndicator currentStep={3} totalSteps={3} steps={['Macros', 'Inventory', 'Recipe']} />

        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground mb-2">{recipe.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.cookingTime} mins</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4" />
                  <span>{recipe.equipment.length} equipment</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <Star
                    className={cn(
                      'w-6 h-6',
                      star <= rating ? 'fill-accent text-accent' : 'text-muted'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ri, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-card-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>{ri.quantity}g {ri.ingredient.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Equipment Needed</h3>
              <ul className="space-y-2">
                {recipe.equipment.map((eq, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-card-foreground capitalize">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>{eq.replace('-', ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Instructions</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </span>
                  <span className="text-card-foreground pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Nutritional Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold">Macro</th>
                    <th className="text-center py-2 px-3 font-semibold">Target</th>
                    <th className="text-center py-2 px-3 font-semibold">Actual</th>
                    <th className="text-center py-2 px-3 font-semibold">Match</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-3 font-medium">Protein</td>
                    <td className="text-center py-3 px-3">{macroTargets.protein}g</td>
                    <td className="text-center py-3 px-3 font-semibold">{recipe.macros.protein}g</td>
                    <td className="flex justify-center py-3 px-3">{getMatchIcon(targetMatch.protein)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-3 font-medium">Carbs</td>
                    <td className="text-center py-3 px-3">{macroTargets.carbs}g</td>
                    <td className="text-center py-3 px-3 font-semibold">{recipe.macros.carbs}g</td>
                    <td className="flex justify-center py-3 px-3">{getMatchIcon(targetMatch.carbs)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-3 font-medium">Fats</td>
                    <td className="text-center py-3 px-3">{macroTargets.fats}g</td>
                    <td className="text-center py-3 px-3 font-semibold">{recipe.macros.fats}g</td>
                    <td className="flex justify-center py-3 px-3">{getMatchIcon(targetMatch.fats)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">Calories</td>
                    <td className="text-center py-3 px-3">-</td>
                    <td className="text-center py-3 px-3 font-semibold">{recipe.macros.calories}</td>
                    <td className="text-center py-3 px-3">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="text-lg font-semibold mb-2 text-primary">Why this recipe?</h3>
            <p className="text-card-foreground">{recipe.explanation}</p>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            size="lg"
            className="h-14 text-lg"
            onClick={() => navigate('/inventory')}
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 text-lg"
            onClick={generateNewRecipe}
          >
            <RefreshCw className="mr-2 w-5 h-5" />
            Another Recipe
          </Button>
          <Button
            size="lg"
            className="h-14 text-lg"
            onClick={() => navigate('/')}
          >
            Adjust Macros
          </Button>
        </div>
      </div>
    </div>
  );
}
