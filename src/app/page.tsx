'use client';

import PredictionMarketTest from '@/components/prediction-market-test/PredictionMarketTest';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <h1 className="text-2xl p-4">Test Header</h1>
      <PredictionMarketTest />
    </main>
  );
}