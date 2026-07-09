import { NextRequest } from "next/server";
import { env, pipeline } from "@huggingface/transformers";
import { findMostSimilar, type SimilarityResult } from "../../_lib/rag";

let pipe: any = null;

env.backends.onnx.wasm!.numThreads = 1;
env.allowLocalModels = false;

async function getPipe() {
  if (!pipe) {
    pipe = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2", {
    });
  }
  return pipe;
}

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  if (!query || typeof query !== "string") {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const embedder = await getPipe();
  const start = performance.now();

  const output = await embedder(query, { pooling: "mean", normalize: true });
  const vector = Array.from(output.data as number[]);

  const results = findMostSimilar(vector, 10);

  const end = performance.now();

  return Response.json({ results, latency: end - start });
}
