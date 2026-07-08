import { trashData } from './ragTrashData';

export interface TrashItem {
  id: number;
  nama_sampah: string;
  kategori: string;
  satuan: string;
  co2_reduction_kg: number;
  harga_rupiah: number;
  metadata: {
    text_represented: string;
    embedding_dimension: number;
  };
  embedding: number[];
}

export interface SimilarityResult extends Omit<TrashItem, 'embedding'> {
  similarity: number;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vector dimensions must match');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findMostSimilar(queryVector: number[], topK: number = 5): SimilarityResult[] {
  return trashData
    .map((item) => {
      const { embedding, ...rest } = item;
      return {
        ...rest,
        similarity: cosineSimilarity(queryVector, item.embedding),
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}