'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";

interface Market {
  id: string;
  question: string;
  endTime: number;
  resolved: boolean;
  yesPrice: number;
  noPrice: number;
}

export function MarketsList() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    setMarkets([
      {
        id: '1',
        question: 'Will it rain on March 14, 2025?',
        endTime: 1742188800,
        resolved: false,
        yesPrice: 0.6,
        noPrice: 0.4
      }
    ]);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading markets...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prediction Markets</h1>
        <Link 
          href="/markets/create" 
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Create Market
        </Link>
      </div>

      <div className="grid gap-4">
        {markets.map((market) => (
          <Link key={market.id} href={`/markets/${market.id}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold">{market.question}</h2>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}