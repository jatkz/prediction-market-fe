import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

export const PredictionMarket: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    console.log('Component mounted');
  }, []);

  const [marketState, setMarketState] = useState({
    yesSupply: 1000,
    noSupply: 1000,
    yesPrice: 0.5,
    noPrice: 0.5,
    collateralPool: 0,
    priceHistory: [
      { time: '0', yesPrice: 0.5, noPrice: 0.5 },
    ]
  });

  const [tradeAmount, setTradeAmount] = useState(100);

  if (!isClient) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            Prediction Market Test
          </h2>
        </div>

        <div className="p-6">
          {/* Basic stats first */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">YES Token</h3>
              <p>Price: ${marketState.yesPrice.toFixed(4)}</p>
              <p>Supply: {marketState.yesSupply.toFixed(0)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">NO Token</h3>
              <p>Price: ${marketState.noPrice.toFixed(4)}</p>
              <p>Supply: {marketState.noSupply.toFixed(0)}</p>
            </div>
          </div>

          {/* Chart in its own error boundary */}
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

          {/* Trading interface */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                value={tradeAmount}
                onChange={(e) => setTradeAmount(Number(e.target.value))}
                className="border p-2 rounded-lg"
              />
              <button 
                onClick={() => {
                  console.log('Buy YES clicked');
                  simulateTrade(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Buy YES
              </button>
              <button 
                onClick={() => {
                  console.log('Buy NO clicked');
                  simulateTrade(false);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Buy NO
              </button>
            </div>

            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle size={20} />
              <p>Collateral Pool: ${marketState.collateralPool.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function simulateTrade(buyYes: boolean) {
    console.log('Simulating trade:', { buyYes, amount: tradeAmount });
    const amount = Number(tradeAmount);
    const collateral = amount * 0.1;
    const newYesSupply = marketState.yesSupply + (buyYes ? amount : 0);
    const newNoSupply = marketState.noSupply + (buyYes ? 0 : amount);
    
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
  }
};

export default PredictionMarket;