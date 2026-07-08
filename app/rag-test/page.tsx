"use client";

import { useState } from "react";
import type { SimilarityResult } from "@/app/_lib/rag";

export default function RagTestPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const res = await fetch("/api/rag-search", {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    setLatency(data.latency);
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 text-black">
      <h1 className="mb-4 text-xl font-bold">RAG Test</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Cari sampah... (e.g. botol plastik)"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "..." : "Cari"}
        </button>
      </div>

      {latency !== null && (
        <p className="mb-2 text-sm text-gray-500">
          Latency: {(latency / 1000).toFixed(2)}s
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((item, i) => (
            <li key={item.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  #{i + 1} {item.nama_sampah}
                </span>
                <span className="text-sm text-gray-500">
                  {(item.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {item.kategori} &middot; Rp{item.harga_rupiah.toLocaleString()}/{item.satuan}
                &middot; {item.co2_reduction_kg} kg CO₂
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
