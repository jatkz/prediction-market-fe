import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  yesTokens: number;
  noTokens: number;
  totalTrades: number;
}

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

export const PredictionMarketTest: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Alice',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0
    },
    {
      id: '2',
      name: 'Bob',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0
    },
    {
      id: '3',
      name: 'Charlie',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0
    },
    {
      id: '4',
      name: 'Diana',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0
    }
  ]);

  const getAvatarUrl = (name: string) => {
    // Using DiceBear Avatars with Bottts style
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
  };

  const [tradeAmount, setTradeAmount] = useState(100);

  const simulateTrade = (buyYes: boolean, userId?: string) => {
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

    // Update user's tokens if a user is specified
    if (userId) {
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            yesTokens: user.yesTokens + (buyYes ? amount : 0),
            noTokens: user.noTokens + (buyYes ? 0 : amount),
            totalTrades: user.totalTrades + 1
          };
        }
        return user;
      }));
    }
  };

  if (!isClient) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            Prediction Market: Will it rain on March 14, 2025?
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

          <div className="w-full h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketState.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="yesPrice" stroke="#82ca9d" name="YES Token" />
                <Line type="monotone" dataKey="noPrice" stroke="#8884d8" name="NO Token" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input 
                type="number" 
                value={tradeAmount}
                onChange={(e) => setTradeAmount(Number(e.target.value))}
                className="w-full sm:w-auto border p-2 rounded-lg"
              />
              <button 
                onClick={() => simulateTrade(true, selectedUser || undefined)}
                className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Buy YES
              </button>
              <button 
                onClick={() => simulateTrade(false, selectedUser || undefined)}
                className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Buy NO
              </button>
            </div>

            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle size={20} />
              <p>Collateral Pool: ${marketState.collateralPool.toFixed(2)}</p>
            </div>
          </div>

          {/* Traders Section */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Market Traders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {users.map((user) => (
                <Card 
                  key={user.id}
                  className={`cursor-pointer transition-colors ${
                    selectedUser === user.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedUser(user.id === selectedUser ? null : user.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={getAvatarUrl(user.name)} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-bold">{user.name}</h4>
                        <p className="text-sm text-gray-500">Trades: {user.totalTrades}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                        <span>YES Tokens: {user.yesTokens}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 mr-2 text-blue-500" />
                        <span>NO Tokens: {user.noTokens}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionMarketTest;