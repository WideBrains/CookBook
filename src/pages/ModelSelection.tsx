import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { ArrowLeft, ArrowRight, Zap, Code, Dna, TrendingUp } from 'lucide-react';
import { OptimizationModel } from '@/utils/optimizationModels';

export default function ModelSelection() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<OptimizationModel>('lp');

  const models = [
    {
      id: 'lp' as OptimizationModel,
      name: 'Linear Programming (LP)',
      icon: Zap,
      description: 'Fast and optimal. Uses continuous quantities for precision.',
      speed: 'Fastest',
      quality: 'Excellent',
      badge: 'Recommended',
      badgeVariant: 'default' as const
    },
    {
      id: 'milp' as OptimizationModel,
      name: 'Mixed-Integer LP (MILP)',
      icon: Code,
      description: 'Realistic portions. Constrains ingredients to 50g increments.',
      speed: 'Fast',
      quality: 'Excellent',
      badge: 'Realistic',
      badgeVariant: 'secondary' as const
    },
    {
      id: 'genetic' as OptimizationModel,
      name: 'Genetic Algorithm (GA)',
      icon: Dna,
      description: 'Evolutionary approach. Explores creative ingredient combinations.',
      speed: 'Moderate',
      quality: 'Good',
      badge: 'Creative',
      badgeVariant: 'outline' as const
    },
    {
      id: 'greedy' as OptimizationModel,
      name: 'Greedy Heuristic',
      icon: TrendingUp,
      description: 'Simple baseline. Uses fixed proportions without optimization.',
      speed: 'Fastest',
      quality: 'Basic',
      badge: 'Baseline',
      badgeVariant: 'outline' as const
    }
  ];

  const handleGenerate = () => {
    sessionStorage.setItem('optimizationModel', selectedModel);
    navigate('/recipe');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <ProgressIndicator currentStep={3} totalSteps={3} steps={['Macros', 'Inventory', 'Model']} />

        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-semibold text-card-foreground mb-2">
            Choose Optimization Model
          </h2>
          <p className="text-muted-foreground mb-6">
            Select the algorithm that will generate your recipe
          </p>

          <RadioGroup value={selectedModel} onValueChange={(value) => setSelectedModel(value as OptimizationModel)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map((model) => {
                const Icon = model.icon;
                return (
                  <div
                    key={model.id}
                    className={`relative cursor-pointer transition-all ${
                      selectedModel === model.id
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:bg-secondary/30'
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <Card className="p-6 h-full">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={model.id} id={model.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <Label htmlFor={model.id} className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                              <Icon className="w-5 h-5 text-primary" />
                              {model.name}
                            </Label>
                            <Badge variant={model.badgeVariant}>{model.badge}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {model.description}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="font-medium text-foreground">Speed:</span>{' '}
                              <span className="text-muted-foreground">{model.speed}</span>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Quality:</span>{' '}
                              <span className="text-muted-foreground">{model.quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={() => navigate('/inventory')}
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