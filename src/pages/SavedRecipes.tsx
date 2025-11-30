import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Clock, Utensils, Trash2, ChefHat } from 'lucide-react';

interface SavedRecipe {
  id: string;
  title: string;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  cooking_time: number;
  optimization_model: string;
  created_at: string;
}

export default function SavedRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      } else {
        loadRecipes();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes((data as any) || []);
    } catch (error: any) {
      toast.error('Failed to load recipes');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecipes(recipes.filter(r => r.id !== id));
      toast.success('Recipe deleted');
    } catch (error: any) {
      toast.error('Failed to delete recipe');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading your recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Recipes</h1>
          <p className="text-muted-foreground">
            Your saved macro-optimized recipes
          </p>
        </div>

        {recipes.length === 0 ? (
          <Card className="p-12 text-center">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No saved recipes yet</h3>
            <p className="text-muted-foreground mb-6">
              Generate your first recipe to get started!
            </p>
            <Button onClick={() => navigate('/macro-input')}>
              Generate Recipe
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-foreground flex-1">
                    {recipe.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecipe(recipe.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cooking_time} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Utensils className="w-4 h-4" />
                    <Badge variant="secondary">{recipe.optimization_model?.toUpperCase() || 'N/A'}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="font-semibold text-foreground">Protein</div>
                    <div className="text-muted-foreground">{recipe.macros.protein.toFixed(0)}g</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="font-semibold text-foreground">Carbs</div>
                    <div className="text-muted-foreground">{recipe.macros.carbs.toFixed(0)}g</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="font-semibold text-foreground">Fats</div>
                    <div className="text-muted-foreground">{recipe.macros.fats.toFixed(0)}g</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="font-semibold text-foreground">Calories</div>
                    <div className="text-muted-foreground">{recipe.macros.calories.toFixed(0)}</div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                  Saved {new Date(recipe.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}