import { GoogleGenAI, Modality, Type } from "@google/genai";

// Assume process.env.API_KEY is available
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function editImageWithPrompt(
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const model = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    
    throw new Error('No image was generated in the response.');

  } catch (error) {
    console.error('Error calling Gemini API for image editing:', error);
    if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while calling the Gemini API for image editing.');
  }
}

export interface FloraDetail {
    name: string;
    description: string;
    care_tips: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export async function getPlantDetails(
    originalImage: { base64Data: string; mimeType: string },
    generatedImage: { base64Data: string; mimeType: string }
): Promise<FloraDetail[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `I have provided two images. The second is an edited version of the first, where plants or trees were added. Please identify only the plants or trees that were added. For each added item, provide its common name, a brief description, some simple care tips, and a normalized bounding box. The bounding box should have x, y, width, and height values between 0 and 1, where (x, y) is the top-left corner. Provide your response in the requested JSON format. If no plants or trees were added or you cannot identify them, return an empty list.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            flora: {
                type: Type.ARRAY,
                description: "A list of plants or trees identified in the image.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "The common name of the plant or tree."
                        },
                        description: {
                            type: Type.STRING,
                            description: "A brief description of the plant or tree."
                        },
                        care_tips: {
                            type: Type.STRING,
                            description: "Simple care instructions for the plant or tree."
                        },
                        boundingBox: {
                            type: Type.OBJECT,
                            description: "Normalized coordinates of the item's location.",
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER },
                                width: { type: Type.NUMBER },
                                height: { type: Type.NUMBER },
                            },
                            required: ["x", "y", "width", "height"]
                        }
                    },
                    required: ["name", "description", "care_tips", "boundingBox"]
                }
            }
        },
        required: ["flora"]
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { data: originalImage.base64Data, mimeType: originalImage.mimeType } },
                    { inlineData: { data: generatedImage.base64Data, mimeType: generatedImage.mimeType } },
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.flora as FloraDetail[];

    } catch (error) {
        console.error('Error calling Gemini API for plant details:', error);
        if (error instanceof Error) {
            throw new Error(`API Error: ${error.message}`);
        }
        throw new Error('An unknown error occurred while getting plant details.');
    }
}