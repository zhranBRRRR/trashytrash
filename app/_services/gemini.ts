import axios from "axios";
import type { Chats } from "../_types/chats";

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

interface FunctionCallPart {
  thoughtSignature?: string;
  thought_signature?: string;
  functionCall: {
    name: string;
    args: Record<string, unknown>;
  };
}

interface FunctionResponsePart {
  functionResponse: {
    name: string;
    response: Record<string, unknown>;
  };
}

type ContentPart = TextPart | InlineDataPart | FunctionCallPart | FunctionResponsePart;

interface Content {
  role: Role;
  parts: ContentPart[];
}

/** Schema declaration for a function the model may call. */
interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

/** A tool containing one or more function declarations. */
export interface Tool {
  functionDeclarations: FunctionDeclaration[];
}

/** A function call returned by the model. */
export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
  thoughtSignature?: string;
  thought_signature?: string;
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

function toImageInput(image?: string): ImageInput | null {
  if (!image) return null;

  const match = image.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2],
  };
}

// ─── wasteAnalysisTool argument type ────────────────────────────

/**
 * Typed arguments for the `recordWasteAnalysis` function call.
 */
export interface WasteAnalysisArgs {
  wasteType: string;
  category: "recyclable" | "non-recyclable" | "hazardous";
  confidence: number;
  emissionReduction: number;
  price: number;
  items?: { name: string; count: number }[];
}

// ─── Result types ───────────────────────────────────────────────

type GenerateContentResult =
  | { success: true; data: GeminiResponse }
  | { success: false; error: string };

type GenerateContentWithToolsResult =
  | {
      success: true;
      /** The model's text reply (null if only a function call was returned). */
      text: string | null;
      /** Any function calls the model made (empty array if none). */
      functionCalls: FunctionCall[];
      /**
       * Why the model stopped generating.
       * - "STOP" — natural end, text-only response
       * - "FUNCTION_CALL" — model called a function (check functionCalls)
       * - "SAFETY" — blocked by safety filters
       * - "RECITATION" — blocked for reciting source
       * - "OTHER" — unknown reason
       */
      finishReason: string;
      data: GeminiResponse;
    }
  | { success: false; error: string };

function buildConversationContents(
  history: Chats,
  prompt?: string,
  image?: ImageInput
): Content[] {
  const contents: Content[] = history.flatMap((chat) => {
    const content: Content = {
      role: chat.type === "assistant" ? "model" : "user",
      parts: [{ text: chat.text }],
    };

    const chatImage = toImageInput(chat.image);
    if (chatImage) {
      content.parts.push({
        inlineData: {
          mimeType: chatImage.mimeType,
          data: chatImage.data,
        },
      });
    }

    return [content];
  });

  if (prompt !== undefined) {
    const parts: ContentPart[] = [{ text: prompt }];

    if (image) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    contents.push({ role: "user", parts });
  }

  return contents;
}

// ─── Public API ─────────────────────────────────────────────────

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
      const errorMsg = err.response?.data?.error?.message ?? err.message;
      return { success: false, error: errorMsg };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Fetches a generated response from Gemini with function/tool declarations.
 * The model may reply with text, a function call, or both.
 *
 * @param prompt - The text prompt to send.
 * @param tools - Array of Tool objects declaring available functions.
 * @param model - The model name. Defaults to "gemini-2.0-flash".
 * @param systemPrompt - Optional system instruction.
 * @param image - Optional base64-encoded image.
 * @returns An object with separated `text` and `functionCalls`.
 */
export async function generateContentWithTools(
  prompt: string,
  tools: Tool[],
  history: Chats = [],
  model: string = "gemini-2.0-flash",
  systemPrompt?: string,
  image?: ImageInput
): Promise<GenerateContentWithToolsResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error:
        "Missing Gemini API key. Set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.",
    };
  }

  try {
    const body: Record<string, unknown> = {
      contents: buildConversationContents(history, prompt, image),
      tools,
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

    // Extract text and function calls from the candidate's parts
    const candidate = data.candidates?.[0]?.content;
    const text =
      candidate?.parts?.find((p): p is TextPart => "text" in p)?.text ?? null;
    const functionCalls: FunctionCall[] =
      candidate?.parts
        ?.filter((p): p is FunctionCallPart => "functionCall" in p)
        .map((p) => ({
          name: p.functionCall.name,
          args: p.functionCall.args,
          thoughtSignature:
            p.thoughtSignature ?? p.thought_signature,
        })) ?? [];

    const finishReason = data.candidates?.[0]?.finishReason ?? "OTHER";

    return { success: true, text, functionCalls, finishReason, data };
  } catch (err) {
    if (axios.isAxiosError<GeminiErrorResponse>(err)) {
      const errorMsg = err.response?.data?.error?.message ?? err.message;
      return { success: false, error: errorMsg };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Sends a function response back to Gemini after a model function call.
 * The response is intentionally simple and can be used as an acknowledgement.
 */
export async function sendFunctionResponse(
  tools: Tool[],
  history: Chats = [],
  functionCalls: FunctionCall[] = [],
  responseText = "OK!",
  model: string = "gemini-2.0-flash",
  systemPrompt?: string,
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
    const contents = buildConversationContents(history);

    contents.push({
      role: "model",
      parts: functionCalls.map((call) => {
        const thoughtSignature = call.thought_signature ?? call.thoughtSignature;

        return {
          functionCall: {
            name: call.name,
            args: call.args,
          },
          ...(thoughtSignature
            ? { thought_signature: thoughtSignature }
            : {}),
        };
      }),
    });

    contents.push({
      role: "user",
      parts: functionCalls.map((call) => ({
        functionResponse: {
          name: call.name,
          response: { result: responseText },
        },
      })),
    });

    const body: Record<string, unknown> = {
      contents,
      tools,
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
      const errorMsg = err.response?.data?.error?.message ?? err.message;
      return { success: false, error: errorMsg };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Extracts only the model's text reply from a successful API response.
 * Returns null if no text part is found.
 */
export function extractReplyText(
  result: GenerateContentResult | GenerateContentWithToolsResult
): string | null {
  if (!result.success) return null;

  const candidate = result.data.candidates?.[0]?.content;
  const textPart = candidate?.parts?.find((p): p is TextPart => "text" in p);
  return textPart?.text ?? null;
}

/**
 * Extracts all function calls from a successful API response.
 * Returns an empty array if none were made.
 */
export function extractFunctionCalls(
  result: GenerateContentResult | GenerateContentWithToolsResult
): FunctionCall[] {
  if (!result.success) return [];

  const candidate = result.data.candidates?.[0]?.content;
  return (
    candidate?.parts
      ?.filter((p): p is FunctionCallPart => "functionCall" in p)
      .map((p) => ({
        name: p.functionCall.name,
        args: p.functionCall.args,
        thoughtSignature: p.thoughtSignature ?? p.thought_signature,
      })) ?? []
  );
}

/**
 * Extracts and casts `recordWasteAnalysis` arguments from a successful response.
 * Returns the typed args if the named function call exists, otherwise null.
 *
 * @example
 * ```ts
 * const args = extractWasteAnalysisArgs(result);
 * if (args) {
 *   console.log(args.wasteType, args.price); // fully typed
 * }
 * ```
 */
export function extractWasteAnalysisArgs(
  result: GenerateContentResult | GenerateContentWithToolsResult
): WasteAnalysisArgs | null {
  if (!result.success) return null;

  const candidate = result.data.candidates?.[0]?.content;
  const fnCall = candidate?.parts?.find(
    (p): p is FunctionCallPart =>
      "functionCall" in p && p.functionCall.name === "recordWasteAnalysis"
  );

  if (!fnCall) return null;

  return fnCall.functionCall.args as unknown as WasteAnalysisArgs;
}

// ─── Helpers ────────────────────────────────────────────────────

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
      const base64 = result.split(",")[1];
      resolve({ mimeType: file.type, data: base64 });
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

// ─── Pre-built tool definitions ─────────────────────────────────

/**
 * Pre-built tool for analysing waste images.
 * The model will call `recordWasteAnalysis` with structured data about
 * the detected waste items when used with `generateContentWithTools`.
 */
export const wasteAnalysisTool: Tool = {
  functionDeclarations: [
    {
      name: "recordWasteAnalysis",
      description: "Record analysis of a waste item from an image. Always also provide a human-readable analysis in text first. (example: this is a water bottle with a price of Rp.500 if you sell it. You can dispose this in a yellow trash marked with 'anorganic' and reduce emmision of 0.05)",
      parameters: {
        type: "object",
        properties: {
          wasteType: {
            type: "string",
            description: "e.g. plastic, glass, paper, metal, organic",
          },
          category: {
            type: "string",
            enum: ["recyclable", "non-recyclable", "hazardous"],
          },
          confidence: {
            type: "number",
            description: "0-1 confidence score",
          },
          emissionReduction: {
            type: "number",
            description: "CO₂-eq reduction in kg",
          },
          price: {
            type: "number",
            description: "estimated value in IDR",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                count: { type: "integer" },
              },
            },
          },
        },
        required: [
          "wasteType",
          "category",
          "confidence",
          "emissionReduction",
          "price",
        ],
      },
    },
  ],
};
