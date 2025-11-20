import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { UploadedImage } from '../types';

const MAX_RETRIES = 3;

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const modifyPromptForJob = async (originalPrompt: string, jobTitle: string): Promise<string> => {
  try {
    const systemInstruction = `You are a prompt rewriting assistant. Your task is to modify the description of the clothing or outfit in the provided prompt to be appropriate for the job title of a "${jobTitle}".
- You MUST NOT change any other part of the prompt, such as the background, lighting, pose, camera angle, subject's expression, or overall mood.
- Only alter the text describing what the person is wearing.
- If the original prompt does not mention clothing, add a suitable clothing description for the specified job.
- Your response MUST be a JSON object with a single key "modifiedPrompt" which contains the full, rewritten prompt as a string.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Original prompt: "${originalPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modifiedPrompt: {
              type: Type.STRING,
              description: "The full prompt with only the clothing description modified for the job.",
            },
          },
          required: ["modifiedPrompt"],
        },
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (parsed.modifiedPrompt && typeof parsed.modifiedPrompt === 'string') {
      return parsed.modifiedPrompt;
    } else {
      throw new Error("Invalid JSON structure in prompt modification response.");
    }
  } catch (error) {
    console.error(`Failed to modify prompt for job "${jobTitle}":`, error);
    // As a fallback, return the original prompt so generation doesn't completely fail.
    return originalPrompt;
  }
};

export const modifyPromptForConcept = async (originalPrompt: string, concept: string): Promise<string> => {
  try {
    const systemInstruction = `You are a prompt rewriting assistant for an AI image generator. Your task is to incorporate the following concept or object into the user's prompt: "${concept}".
- You MUST integrate the concept/object naturally into the scene. For example, if the concept is "holding a book", add that action. If it's "cyberpunk theme", add descriptive words related to that theme to the background, clothing, or subject.
- You MUST NOT change the core elements of the original prompt, such as the overall composition, camera angle, lighting style (e.g., "cinematic lighting"), subject's pose (unless the concept requires it, like "sitting"), or expression.
- Only add or modify parts of the prompt to include the new concept/object.
- Your response MUST be a JSON object with a single key "modifiedPrompt" which contains the full, rewritten prompt as a string.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Original prompt: "${originalPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modifiedPrompt: {
              type: Type.STRING,
              description: "The full prompt with the specified concept or object incorporated.",
            },
          },
          required: ["modifiedPrompt"],
        },
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (parsed.modifiedPrompt && typeof parsed.modifiedPrompt === 'string') {
      return parsed.modifiedPrompt;
    } else {
      throw new Error("Invalid JSON structure in prompt modification response.");
    }
  } catch (error) {
    console.error(`Failed to modify prompt for concept "${concept}":`, error);
    return originalPrompt; // Fallback to original prompt
  }
};


export const generateStudioImage = async (
  baseImages: UploadedImage[],
  prompt: string
): Promise<string> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const imageParts = baseImages.map(image => ({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            ...imageParts,
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData
      );

      if (imagePart && imagePart.inlineData) {
        return imagePart.inlineData.data;
      } else {
        throw new Error("No image data found in API response.");
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed for prompt: "${prompt}"`, error);
      if (attempt === MAX_RETRIES) {
        throw new Error(
          "Failed to generate image after multiple attempts. This could be due to content moderation or API limits."
        );
      }
      // Optional: add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Image generation failed unexpectedly.");
};

export const generateNewPrompts = async (originalPrompt: string): Promise<string[]> => {
  try {
    const systemInstruction = `You are a creative prompt engineer for an AI image generator. Based on the user's original prompt, create 5 new variations.
- The goal is to generate images that are clearly different but belong to the same stylistic photoshoot.
- Maintain the original prompt's core mood, overall aesthetic, and subject description.
- Introduce noticeable variations in elements like:
    - **Clothing:** Change the outfit to something different but appropriate for the original style (e.g., another type of professional suit, a different style of casual dress).
    - **Pose:** Describe a different pose for the subject (e.g., sitting instead of standing, leaning against a wall, a different hand gesture).
    - **Lighting:** Alter the lighting setup (e.g., change from soft, even lighting to more dramatic side lighting, or from warm to cool tones).
    - **Camera Angle:** Slightly modify the camera angle (e.g., from eye-level to a slightly low or high angle).
- Avoid changing the fundamental background setting (e.g., studio), the subject's core identity, or the main color palette drastically.
- Ensure the output is a JSON object with a single key "prompts" containing an array of 5 string prompts.
- Do not include the original prompt in the output.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Original prompt: "${originalPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["prompts"],
        },
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (parsed.prompts && Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
      return parsed.prompts.slice(0, 5); // Ensure exactly 5 prompts are returned
    } else {
      throw new Error("Invalid JSON structure in prompt generation response.");
    }
  } catch (error) {
    console.error("Failed to generate new prompts:", error);
    // Fallback or re-throw
    throw new Error("Could not generate new creative prompts.");
  }
};

export const generateStudioVideo = async (
  baseImage: UploadedImage,
  prompt: string
): Promise<string> => {
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: baseImage.base64,
        mimeType: baseImage.mimeType,
      },
      config: {
        numberOfVideos: 1,
      },
    });

    while (!operation.done) {
      // Poll every 10 seconds. Video generation can take a few minutes.
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('Video generation succeeded but no download link was found.');
    }

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error('Failed to generate video:', error);
    throw new Error('Could not generate the video.');
  }
};