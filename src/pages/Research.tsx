import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ResearchRun {
  id: string;
  model_type: string;
  solve_time_ms: number;
  macro_accuracy: any;
  feasibility_status: string;
  created_at: string;
}

export default function Research() {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadResearchData();
  }, []);

  const loadResearchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('research_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const typedData = (data as any) || [];
      setRuns(typedData);
      calculateStats(typedData);
    } catch (error: any) {
      console.error('Failed to load research data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: ResearchRun[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const byModel = data.reduce((acc: any, run) => {
      if (!acc[run.model_type]) {
        acc[run.model_type] = { count: 0, totalSolveTime: 0, feasibleCount: 0 };
      }
      acc[run.model_type].count++;
      acc[run.model_type].totalSolveTime += run.solve_time_ms;
      if (run.feasibility_status === 'feasible') acc[run.model_type].feasibleCount++;
      return acc;
    }, {});

    Object.keys(byModel).forEach(model => {
      byModel[model].avgSolveTime = byModel[model].totalSolveTime / byModel[model].count;
      byModel[model].feasibilityRate = (byModel[model].feasibleCount / byModel[model].count) * 100;
    });

    setStats(byModel);
  };

  const exportData = () => {
    const csv = [
      ['Model', 'Solve Time (ms)', 'Feasibility', 'Timestamp'].join(','),
      ...runs.map(run => [run.model_type, run.solve_time_ms, run.feasibility_status, new Date(run.created_at).toISOString()].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-data-${Date.now()}.csv`;
    a.click();
    toast.success('Data exported successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Research Dashboard</h1>
            <p className="text-muted-foreground">Compare optimization model performance</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={loadResearchData}><RefreshCw className="mr-2 w-4 h-4" />Refresh</Button>
            <Button onClick={exportData} disabled={runs.length === 0}><Download className="mr-2 w-4 h-4" />Export CSV</Button>
          </div>
        </div>

        {!stats ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2 text-foreground">No research data yet</h3>
            <p className="text-muted-foreground">Generate recipes to collect performance data</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Object.entries(stats).map(([model, data]: [string, any]) => (
                <Card key={model} className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">{model.toUpperCase()}</h3>
                  <Badge variant="secondary" className="mb-4">{data.count} runs</Badge>
                  <div className="space-y-2">
                    <div><span className="text-sm text-muted-foreground">Avg Time:</span> <span className="font-bold">{data.avgSolveTime.toFixed(1)}ms</span></div>
                    <div><span className="text-sm text-muted-foreground">Success:</span> <span className="font-bold text-success">{data.feasibilityRate.toFixed(1)}%</span></div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Recent Runs</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Model</th>
                      <th className="text-right py-3 px-4">Time</th>
                      <th className="text-center py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.slice(0, 20).map((run) => (
                      <tr key={run.id} className="border-b border-border">
                        <td className="py-3 px-4"><Badge variant="outline">{run.model_type.toUpperCase()}</Badge></td>
                        <td className="text-right py-3 px-4 text-muted-foreground">{run.solve_time_ms.toFixed(0)}ms</td>
                        <td className="text-center py-3 px-4"><Badge variant={run.feasibility_status === 'feasible' ? 'default' : 'destructive'}>{run.feasibility_status}</Badge></td>
                        <td className="text-right py-3 px-4 text-muted-foreground text-sm">{new Date(run.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}