import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping from Google Vision labels to our ingredient IDs
const LABEL_TO_INGREDIENT_MAP: Record<string, string[]> = {
  // Proteins
  'chicken': ['chicken-breast', 'chicken-thigh'],
  'beef': ['ground-beef', 'beef-steak'],
  'fish': ['salmon', 'tuna'],
  'salmon': ['salmon'],
  'tuna': ['tuna'],
  'egg': ['eggs'],
  'tofu': ['tofu'],
  'yogurt': ['greek-yogurt'],
  'cheese': ['cheddar-cheese'],
  'turkey': ['turkey-breast'],
  'pork': ['pork-tenderloin'],
  'shrimp': ['shrimp'],
  'chickpea': ['chickpeas'],
  'lentil': ['lentils'],
  'bean': ['black-beans', 'chickpeas'],
  
  // Carbohydrates
  'rice': ['white-rice', 'brown-rice'],
  'pasta': ['pasta'],
  'bread': ['whole-wheat-bread'],
  'oat': ['oats'],
  'quinoa': ['quinoa'],
  'potato': ['potatoes', 'sweet-potatoes'],
  'tortilla': ['tortillas'],
  'sweet potato': ['sweet-potatoes'],
  
  // Vegetables
  'spinach': ['spinach'],
  'broccoli': ['broccoli'],
  'carrot': ['carrots'],
  'tomato': ['tomatoes'],
  'pepper': ['bell-peppers'],
  'bell pepper': ['bell-peppers'],
  'onion': ['onions'],
  'garlic': ['garlic'],
  'mushroom': ['mushrooms'],
  'lettuce': ['lettuce'],
  'cucumber': ['cucumber'],
  'zucchini': ['zucchini'],
  'cauliflower': ['cauliflower'],
  'asparagus': ['asparagus'],
  'kale': ['kale'],
  
  // Fats
  'avocado': ['avocado'],
  'almond': ['almonds'],
  'nut': ['almonds', 'walnuts'],
  'peanut butter': ['peanut-butter'],
  'butter': ['butter'],
  'oil': ['olive-oil', 'coconut-oil'],
  'olive oil': ['olive-oil'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!GOOGLE_VISION_API_KEY) {
      throw new Error('GOOGLE_VISION_API_KEY not configured');
    }

    const { images, confidenceThreshold = 0.7 } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${images.length} images with confidence threshold ${confidenceThreshold}`);

    const allDetectedIngredients: Array<{
      name: string;
      id: string;
      confidence: number;
    }> = [];

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const imageBase64 = images[i];
      
      // Remove data:image/xxx;base64, prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      console.log(`Processing image ${i + 1}/${images.length}`);

      // Call Google Cloud Vision API
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: cleanBase64 },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 20 },
                { type: 'OBJECT_LOCALIZATION', maxResults: 20 }
              ]
            }]
          })
        }
      );

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error(`Vision API error for image ${i + 1}:`, errorText);
        continue;
      }

      const visionData = await visionResponse.json();
      const annotations = visionData.responses[0];

      // Process label annotations
      if (annotations.labelAnnotations) {
        for (const label of annotations.labelAnnotations) {
          const labelName = label.description.toLowerCase();
          const confidence = label.score;

          console.log(`Label detected: ${labelName} (confidence: ${confidence})`);

          if (confidence >= confidenceThreshold) {
            // Check if label matches any ingredient
            for (const [key, ingredientIds] of Object.entries(LABEL_TO_INGREDIENT_MAP)) {
              if (labelName.includes(key) || key.includes(labelName)) {
                for (const ingredientId of ingredientIds) {
                  allDetectedIngredients.push({
                    id: ingredientId,
                    name: ingredientId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    confidence: confidence
                  });
                }
              }
            }
          }
        }
      }

      // Process object localization
      if (annotations.localizedObjectAnnotations) {
        for (const object of annotations.localizedObjectAnnotations) {
          const objectName = object.name.toLowerCase();
          const confidence = object.score;

          console.log(`Object detected: ${objectName} (confidence: ${confidence})`);

          if (confidence >= confidenceThreshold) {
            for (const [key, ingredientIds] of Object.entries(LABEL_TO_INGREDIENT_MAP)) {
              if (objectName.includes(key) || key.includes(objectName)) {
                for (const ingredientId of ingredientIds) {
                  allDetectedIngredients.push({
                    id: ingredientId,
                    name: ingredientId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    confidence: confidence
                  });
                }
              }
            }
          }
        }
      }
    }

    // Deduplicate and keep highest confidence for each ingredient
    const ingredientMap = new Map<string, { name: string; id: string; confidence: number }>();
    for (const ingredient of allDetectedIngredients) {
      const existing = ingredientMap.get(ingredient.id);
      if (!existing || ingredient.confidence > existing.confidence) {
        ingredientMap.set(ingredient.id, ingredient);
      }
    }

    const detectedIngredients = Array.from(ingredientMap.values())
      .sort((a, b) => b.confidence - a.confidence);

    console.log(`Successfully detected ${detectedIngredients.length} unique ingredients`);

    return new Response(
      JSON.stringify({ 
        detectedIngredients,
        totalImages: images.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-ingredients function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
