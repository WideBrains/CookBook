import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { MacroTargets } from '@/types/recipe';
import { ChefHat, ArrowRight } from 'lucide-react';

export default function MacroInput() {
  const navigate = useNavigate();
  const [macros, setMacros] = useState<MacroTargets>({
    protein: 150,
    carbs: 200,
    fats: 50,
    mealType: 'dinner',
  });

  const totalCalories = Math.round(macros.protein * 4 + macros.carbs * 4 + macros.fats * 9);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('macroTargets', JSON.stringify(macros));
    navigate('/inventory');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">MacroFit Recipe Generator</h1>
          <p className="text-muted-foreground text-lg">Create perfect recipes tailored to your nutritional goals</p>
        </div>

        <ProgressIndicator currentStep={1} totalSteps={3} steps={['Macros', 'Inventory', 'Recipe']} />

        <Card className="p-8">
          <h2 className="text-2xl font-semibold text-card-foreground mb-6">What are your macro targets?</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="protein" className="text-base font-medium">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  min="0"
                  value={macros.protein}
                  onChange={(e) => setMacros({ ...macros, protein: parseInt(e.target.value) || 0 })}
                  className="text-lg h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbs" className="text-base font-medium">Carbohydrates (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  min="0"
                  value={macros.carbs}
                  onChange={(e) => setMacros({ ...macros, carbs: parseInt(e.target.value) || 0 })}
                  className="text-lg h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fats" className="text-base font-medium">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  min="0"
                  value={macros.fats}
                  onChange={(e) => setMacros({ ...macros, fats: parseInt(e.target.value) || 0 })}
                  className="text-lg h-12"
                  required
                />
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Total Estimated Calories: <span className="font-bold text-foreground text-lg">{totalCalories} kcal</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealType" className="text-base font-medium">Meal Type</Label>
              <Select
                value={macros.mealType}
                onValueChange={(value: any) => setMacros({ ...macros, mealType: value })}
              >
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" size="lg" className="w-full h-14 text-lg">
              Next: Choose Ingredients
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
