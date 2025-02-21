'use client';

import { PredictionMarketTest } from '@/components/prediction-market/PredictionMarket';

export default function Market({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-gray-50">
      <PredictionMarketTest marketId={params.id} />
    </main>
  );
}