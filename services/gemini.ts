import axios from "axios";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

type Role = "user" | "model";

interface TextPart {
  text: string;
}

interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

type ContentPart = TextPart | InlineDataPart;

interface Content {
  role: Role;
  parts: ContentPart[];
}

interface GeminiResponse {
  candidates: {
    content: Content;
    finishReason: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

export interface ImageInput {
  /** MIME type of the image, e.g. "image/jpeg", "image/png", "image/webp" */
  mimeType: string;
  /** Base64-encoded image data (no prefix, raw base64 string) */
  data: string;
}

type GenerateContentResult =
  | { success: true; data: GeminiResponse }
  | { success: false; error: string };

/**
 * Fetches a generated response from Google AI Studio (Gemini) API.
 *
 * @param prompt - The text prompt to send to the model.
 * @param model - The model name to use (e.g. "gemini-2.0-flash", "gemini-2.0-flash-lite").
 *                Defaults to "gemini-2.0-flash".
 * @param systemPrompt - Optional system instruction to set the model's behaviour/persona.
 * @param image - Optional base64-encoded image to send alongside the prompt.
 * @returns The full Gemini API response on success, or an error message on failure.
 */
export async function generateContent(
  prompt: string,
  model: string = "gemini-2.0-flash",
  systemPrompt?: string,
  image?: ImageInput
): Promise<GenerateContentResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error:
        "Missing Gemini API key. Set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.",
    };
  }

  try {
    const parts: ContentPart[] = [{ text: prompt }];

    if (image) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    const body: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    };

    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const { data } = await axios.post<GeminiResponse>(
      `${API_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
      body
    );

    return { success: true, data };
  } catch (err) {
    if (axios.isAxiosError<GeminiErrorResponse>(err)) {
      const errorMsg =
        err.response?.data?.error?.message ?? err.message;
      return { success: false, error: errorMsg };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Convenience function that extracts only the model's text reply from a
 * successful generateContent call. Returns null if no reply text is found.
 */
export function extractReplyText(result: GenerateContentResult): string | null {
  if (!result.success) return null;

  const firstPart = result.data.candidates?.[0]?.content?.parts?.[0];
  if (!firstPart) return null;

  // Only TextPart has a `text` property; InlineDataPart does not.
  return "text" in firstPart ? firstPart.text : null;
}

/**
 * Converts a browser File object (from an <input type="file"> or drag/drop)
 * into an ImageInput that can be passed to generateContent().
 *
 * @param file - The image file selected by the user.
 * @returns A promise that resolves to ImageInput with the base64 data.
 *
 * @example
 * ```ts
 * const file = event.target.files?.[0];
 * if (file) {
 *   const image = await fileToImageInput(file);
 *   const result = await generateContent("Describe this image", "gemini-2.0-flash", undefined, image);
 * }
 * ```
 */
export function fileToImageInput(file: File): Promise<ImageInput> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // result is a data URL like "data:image/jpeg;base64,/9j4..."
      // Extract the base64 part after the comma
      const base64 = result.split(",")[1];
      resolve({ mimeType: file.type, data: base64 });
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}
