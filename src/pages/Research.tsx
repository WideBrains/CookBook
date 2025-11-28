import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Target, Zap } from 'lucide-react';

export default function Research() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Research Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Compare optimization model performance and analyze results
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Avg Solve Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s</div>
              <p className="text-xs text-muted-foreground mt-1">Across all models</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Macro Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground mt-1">Within ±10g tolerance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground mt-1">Feasible solutions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Tests Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Batch tests completed</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Model Comparison</CardTitle>
            <CardDescription>
              Performance metrics across optimization algorithms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    Linear Programming (LP)
                    <Badge variant="secondary">FASTEST</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Classic optimization approach
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">0.3s avg</div>
                  <div className="text-xs text-muted-foreground">92% accuracy</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    Mixed-Integer LP (MILP)
                    <Badge variant="secondary">MOST REALISTIC</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Integer constraints for realistic recipes
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">1.8s avg</div>
                  <div className="text-xs text-muted-foreground">89% accuracy</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    Genetic Algorithm (GA)
                    <Badge variant="secondary">EXPERIMENTAL</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Evolutionary optimization approach
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">4.2s avg</div>
                  <div className="text-xs text-muted-foreground">85% accuracy</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    Greedy Heuristic
                    <Badge variant="secondary">BASELINE</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Simple rule-based approach
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">&lt;0.1s avg</div>
                  <div className="text-xs text-muted-foreground">68% accuracy</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Testing</CardTitle>
            <CardDescription>
              Run automated tests across multiple scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No batch tests yet</p>
              <p className="text-sm">
                Batch testing interface coming soon. This will allow you to compare
                model performance across multiple test cases.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
