import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Camera, Target, Zap, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 animate-pulse">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            AI-Powered Recipe Generation for Your{' '}
            <span className="text-primary">Macro Goals</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Upload your kitchen inventory, set your targets, and get optimized recipes instantly
          </p>
          
          <Button 
            size="lg" 
            className="h-16 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/macro-input')}
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                📸 Smart Ingredient Detection
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                AI recognizes your ingredients from photos, making inventory input effortless
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                🎯 Precision Macro Targeting
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Hit your nutrition goals exactly with optimized ingredient quantities
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                ⚡ Multiple Optimization Models
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Compare different algorithms to find the perfect recipe for your needs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ready to transform your meal planning?
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/macro-input')}
            className="h-14 px-6"
          >
            Start Generating Recipes
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">Research Paper</a>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            © 2024 MacroFit Recipe Generator. Built for research purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
