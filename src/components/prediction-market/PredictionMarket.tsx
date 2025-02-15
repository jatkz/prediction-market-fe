import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

export interface MarketState {
  yesSupply: number;
  noSupply: number;
  yesPrice: number;
  noPrice: number;
  collateralPool: number;
  priceHistory: Array<{
    time: string;
    yesPrice: number;
    noPrice: number;
  }>;
}

export const PredictionMarket: React.FC = () => {
  const [marketState, setMarketState] = useState<MarketState>({
    yesSupply: 1000,
    noSupply: 1000,
    yesPrice: 0.5,
    noPrice: 0.5,
    collateralPool: 0,
    priceHistory: [
      { time: '0', yesPrice: 0.5, noPrice: 0.5 },
    ]
  });

  const [tradeAmount, setTradeAmount] = useState<number>(100);

  const simulateTrade = (buyYes: boolean) => {
    const amount = Number(tradeAmount);
    const collateral = amount * 0.1; // 10% collateral ratio
    const newYesSupply = marketState.yesSupply + (buyYes ? amount : 0);
    const newNoSupply = marketState.noSupply + (buyYes ? 0 : amount);
    
    // Calculate new prices using constant product formula
    const k = marketState.yesSupply * marketState.noSupply;
    const newYesPrice = k / (newYesSupply * marketState.noSupply);
    const newNoPrice = k / (marketState.yesSupply * newNoSupply);

    const newPricePoint = {
      time: marketState.priceHistory.length.toString(),
      yesPrice: buyYes ? newYesPrice : marketState.yesPrice,
      noPrice: buyYes ? marketState.noPrice : newNoPrice
    };

    setMarketState({
      ...marketState,
      yesSupply: newYesSupply,
      noSupply: newNoSupply,
      yesPrice: newYesPrice,
      noPrice: newNoPrice,
      collateralPool: marketState.collateralPool + collateral,
      priceHistory: [...marketState.priceHistory, newPricePoint]
    });
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Prediction Market: "Will it rain on March 14, 2025?"</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="h-64">
              <LineChart width={600} height={250} data={marketState.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="yesPrice" stroke="#82ca9d" name="YES Token" />
                <Line type="monotone" dataKey="noPrice" stroke="#8884d8" name="NO Token" />
              </LineChart>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">YES Token</h3>
              <p>Price: ${marketState.yesPrice.toFixed(4)}</p>
              <p>Supply: {marketState.yesSupply.toFixed(0)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">NO Token</h3>
              <p>Price: ${marketState.noPrice.toFixed(4)}</p>
              <p>Supply: {marketState.noSupply.toFixed(0)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                value={tradeAmount}
                onChange={(e) => setTradeAmount(Number(e.target.value))}
                className="border p-2 rounded"
              />
              <button 
                onClick={() => simulateTrade(true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Buy YES
              </button>
              <button 
                onClick={() => simulateTrade(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Buy NO
              </button>
            </div>

            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle size={20} />
              <p>Collateral Pool: ${marketState.collateralPool.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionMarket;