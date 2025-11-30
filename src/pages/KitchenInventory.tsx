import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { ImageUpload } from '@/components/ImageUpload';
import { INGREDIENTS, EQUIPMENT_OPTIONS } from '@/data/ingredients';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function KitchenInventory() {
  const navigate = useNavigate();
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const macroTargets = sessionStorage.getItem('macroTargets');
    if (!macroTargets) {
      navigate('/');
    }
  }, [navigate]);

  const filteredIngredients = INGREDIENTS.filter(ing =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ingredientsByCategory = {
    protein: filteredIngredients.filter(i => i.category === 'protein'),
    carbs: filteredIngredients.filter(i => i.category === 'carbs'),
    vegetables: filteredIngredients.filter(i => i.category === 'vegetables'),
    fats: filteredIngredients.filter(i => i.category === 'fats'),
    seasonings: filteredIngredients.filter(i => i.category === 'seasonings'),
  };

  const toggleIngredient = (id: string) => {
    const newSet = new Set(selectedIngredients);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIngredients(newSet);
  };

  const toggleEquipment = (id: string) => {
    const newSet = new Set(selectedEquipment);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEquipment(newSet);
  };

  const handleIngredientsDetected = (ingredientIds: string[]) => {
    const newSet = new Set(selectedIngredients);
    ingredientIds.forEach(id => newSet.add(id));
    setSelectedIngredients(newSet);
    toast.success(`Added ${ingredientIds.length} ingredients to your selection`);
  };

  const handleGenerate = () => {
    if (selectedIngredients.size < 5) {
      toast.error('Please select at least 5 ingredients');
      return;
    }
    if (selectedEquipment.size === 0) {
      toast.error('Please select at least one piece of equipment');
      return;
    }

    sessionStorage.setItem('selectedIngredients', JSON.stringify(Array.from(selectedIngredients)));
    sessionStorage.setItem('selectedEquipment', JSON.stringify(Array.from(selectedEquipment)));
    navigate('/model-selection');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <ProgressIndicator currentStep={2} totalSteps={3} steps={['Macros', 'Inventory', 'Model']} />

        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-semibold text-card-foreground mb-6">What ingredients do you have?</h2>
          
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-foreground">
              AI-Powered Ingredient Detection
            </h3>
            <ImageUpload onIngredientsDetected={handleIngredientsDetected} />
          </div>

          <div className="space-y-6">
            {Object.entries(ingredientsByCategory).map(([category, ingredients]) => {
              if (ingredients.length === 0) return null;
              
              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold capitalize mb-3 text-foreground">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => toggleIngredient(ing.id)}
                      >
                        <Checkbox
                          id={ing.id}
                          checked={selectedIngredients.has(ing.id)}
                          onCheckedChange={() => toggleIngredient(ing.id)}
                        />
                        <Label htmlFor={ing.id} className="cursor-pointer flex-1">
                          {ing.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-semibold text-card-foreground mb-6">
            What cooking equipment do you have?
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => toggleEquipment(eq.id)}
              >
                <Checkbox
                  id={eq.id}
                  checked={selectedEquipment.has(eq.id)}
                  onCheckedChange={() => toggleEquipment(eq.id)}
                />
                <Label htmlFor={eq.id} className="cursor-pointer flex-1">
                  {eq.name}
                </Label>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={handleGenerate}
          >
            Generate Recipe
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
