import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DetectedIngredient {
  name: string;
  confidence: number;
  ingredientId: string | null;
}

interface ImageUploadProps {
  onIngredientsDetected: (ingredientIds: string[]) => void;
}

export function ImageUpload({ onIngredientsDetected }: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - images.length);
    
    // Validate file size (10MB max per file)
    const validFiles = newFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImages(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setDetectedIngredients([]);

    try {
      const allDetectedIds = new Set<string>();

      for (const image of images) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(image);
        });

        const base64Image = await base64Promise;

        const { data, error } = await supabase.functions.invoke('analyze-ingredients', {
          body: { image: base64Image }
        });

        if (error) throw error;

        if (data.ingredients && data.ingredients.length > 0) {
          setDetectedIngredients(prev => [...prev, ...data.ingredients]);
          data.ingredients.forEach((ing: DetectedIngredient) => {
            if (ing.ingredientId && ing.confidence >= 0.6) {
              allDetectedIds.add(ing.ingredientId);
            }
          });
        }
      }

      const detectedCount = allDetectedIds.size;
      if (detectedCount > 0) {
        toast.success(`Detected ${detectedCount} ingredients!`);
        onIngredientsDetected(Array.from(allDetectedIds));
      } else {
        toast.warning('No ingredients detected with sufficient confidence');
      }
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast.error('Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => document.getElementById('file-input')?.click()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileSelect(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-foreground font-medium mb-2">
          Drop kitchen photos here or click to upload
        </p>
        <p className="text-sm text-muted-foreground">
          Upload up to 5 images (10MB each) • JPG, PNG, WEBP
        </p>
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <Button
          onClick={analyzeImages}
          disabled={isAnalyzing}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Analyzing Images...
            </>
          ) : (
            <>
              <Upload className="mr-2 w-5 h-5" />
              Detect Ingredients from {images.length} {images.length === 1 ? 'Image' : 'Images'}
            </>
          )}
        </Button>
      )}

      {detectedIngredients.length > 0 && (
        <div className="p-4 bg-secondary/30 rounded-lg border border-border">
          <h4 className="font-semibold mb-3 text-foreground">Detected Ingredients</h4>
          <div className="space-y-2">
            {detectedIngredients.map((ing, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-foreground">{ing.name}</span>
                <span className={`font-medium ${getConfidenceColor(ing.confidence)}`}>
                  {(ing.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}