'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Wallet, Coins, Check, Copy, Trophy, Search, Plus } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { usePredictionMarket } from '@/hooks/usePredictionMarket';
import { ethers } from 'ethers';

interface TradeParams {
  action: 'buy' | 'sell';
  isYes: boolean;
  amount: number;
  userId?: string;
}

interface User {
  id: string;
  name: string;
  ethAddress: string;
  yesTokens: number;
  noTokens: number;
  totalTrades: number;
  ethBalance: string;
  usdcBalance: string;
}

// USDC Contract ABI (minimal for balance checking)
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
] as const;

const USDC_CONTRACT_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

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

// Update the component props
export interface PredictionMarketProps {
  marketId: string;
}

export const PredictionMarketTest = ({ marketId }: PredictionMarketProps) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [winner, setWinner] = useState<'yes' | 'no' | null>(null);
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Alice',
      ethAddress: process.env.NEXT_PUBLIC_ALICE_PUBLIC_KEY || '',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0,
      ethBalance: '0',
      usdcBalance: '0'
    },
    {
      id: '2',
      name: 'Bob',
      ethAddress: process.env.NEXT_PUBLIC_BOB_PUBLIC_KEY || '',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0,
      ethBalance: '0',
      usdcBalance: '0'
    },
    {
      id: '3',
      name: 'Charlie',
      ethAddress: process.env.NEXT_PUBLIC_CHARLIE_PUBLIC_KEY || '',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0,
      ethBalance: '0',
      usdcBalance: '0'
    },
    {
      id: '4',
      name: 'Diana',
      ethAddress: process.env.NEXT_PUBLIC_DIANA_PUBLIC_KEY || '',
      yesTokens: 0,
      noTokens: 0,
      totalTrades: 0,
      ethBalance: '0',
      usdcBalance: '0'
    }
  ]);
  const [marketQuestion, setMarketQuestion] = useState<string>('');
  const [isTitleLoading, setTitleIsLoading] = useState(false);
  const [tradeAmount, setTradeAmount] = useState(100);
  const [isYes, setYes] = useState<boolean>(true);
  const [isBuy, setBuy] = useState<boolean>(true);

  const selectedUser = users.find(user => user.id === selectedUserId);

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

  const {
    isLoading,
    createMarket,
    tradeTokens,
    resolveMarket,
    getMarketDetails,
    getBatchTokenBalances
  } = usePredictionMarket(selectedUser?.ethAddress || '');

  // Load market details when component mounts or marketId changes
  useEffect(() => {
    if (marketId) {
      handleLoadMarket();
    }
  }, [marketId]);

  const handleLoadMarket = async () => {
    setTitleIsLoading(true);
    try {
      const marketDetails = await getMarketDetails(marketId);
      setMarketQuestion(marketDetails.question);
            
      // Get token balances for all users
      const userAddresses = users.map(user => user.ethAddress);
      const balances = await getBatchTokenBalances(marketId, userAddresses);
      
      const updatedUsers = users.map((user, index) => ({
        ...user,
        yesTokens: Number(balances.yesBalances[index]),
        noTokens: Number(balances.noBalances[index]),
      }));
      
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Failed to load market:', error);
      setMarketQuestion(''); // Clear the question on error
    } finally {
      setTitleIsLoading(false);
    }
  };
  
  const handleCreateMarket = async () => {
    setTitleIsLoading(true);
    try {
      const question = "Will it rain on March 14, 2025?";
      const endTime = Math.floor(new Date('2025-03-14').getTime() / 1000);
      
      const result = await createMarket(question);
      
      // Update both the market ID input and question
      setMarketQuestion(question);
    } catch (error) {
      console.error('Failed to create market:', error);
      // Only clear the question
      setMarketQuestion('');
    } finally {
      setTitleIsLoading(false);
    }
  };
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleResolveMarket = async () => {
    if (!winner) return;
    if (!marketId) return;
    
    try {
      const result = await resolveMarket(marketId, winner === 'yes');
      console.log('Resolve transaction:', result.txHash);
      setIsResolved(true);
      // Update UI or fetch new balances
    } catch (error) {
      console.error('Failed to resolve market:', error);
    }
  };

  const handleTradeTokens = async () => {
    if (!selectedUser) return;
    
    try {
      const result = await tradeTokens(marketId, isYes, isBuy, tradeAmount);
      console.log(`Transaction:`, result.txHash);
    } catch (error) {
      console.error('Failed to execute trade:', error);
      throw error;
    }
  };

  
  useEffect(() => {
    const fetchBalances = async () => {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);

      const updatedUsers = await Promise.all(users.map(async (user) => {
        try {
          const ethBalance = await provider.getBalance(user.ethAddress);
          const usdcBalance = await usdcContract.balanceOf(user.ethAddress);
          const usdcDecimals = await usdcContract.decimals();

          return {
            ...user,
            ethBalance: ethers.formatEther(ethBalance),
            usdcBalance: ethers.formatUnits(usdcBalance, usdcDecimals)
          };
        } catch (error) {
          console.error(`Error fetching balances for ${user.name}:`, error);
          return user;
        }
      }));

      setUsers(updatedUsers);
    };

    if (isClient) {
      fetchBalances();
    }
  }, [isClient]);

  const getAvatarUrl = (name: string) => {
    // Using DiceBear Avatars with Bottts style
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
  };

  const copyToClipboard = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string) => {
    if (!address) return 'No address';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };


  if (!isClient) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-bold">
          {marketQuestion || 'Loading market...'}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">

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
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setBuy(true)}
                    disabled={(isLoading)}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 
                      ${isBuy === true
                        ? 'bg-green-600 text-white ring-2 ring-green-400 ring-offset-2'
                        : 'bg-green-200 text-green-700 hover:bg-green-300'
                      }`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setBuy(false)}
                    disabled={(isLoading)}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50
                      ${isBuy === false
                        ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2'
                        : 'bg-red-200 text-red-700 hover:bg-red-300'
                      }`}
                  >
                    Sell
                  </button>
                  <button 
                    onClick={() => setYes(true)}
                    disabled={(isLoading)}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50
                      ${isYes === true
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2'
                        : 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                      }`}
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => setYes(false)}
                    disabled={(isLoading)}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50
                      ${isYes === false
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2'
                        : 'bg-purple-200 text-purple-700 hover:bg-purple-300'
                      }`}
                  >
                    NO
                  </button>
                </div>
                <div className="flex items-center justify-center h-full">
                  <button 
                    onClick={handleTradeTokens}
                    disabled={(isLoading)}
                    className="inline-flex bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    Execute
                  </button>
                </div>
              </div>
            </div>
          </div>

            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle size={20} />
              <p>Collateral Pool: ${marketState.collateralPool.toFixed(2)}</p>
            </div>
          </div>

          {/* Traders Section */}
          <div className="mt-8 px-6">
            <h3 className="text-lg font-bold mb-4">Market Traders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {users.map((user) => (
                <Card 
                key={user.id}
                className={`cursor-pointer transition-colors ${
                  selectedUserId === user.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedUserId(user.id === selectedUserId ? null : user.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={getAvatarUrl(user.name)}
                      alt={user.name} 
                      className="w-10 h-10 rounded-full bg-gray-100"
                    />
                    <div>
                      <h4 className="font-bold">{user.name}</h4>
                      <p className="text-sm text-gray-500">Trades: {user.totalTrades}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      <span>YES Tokens: {user.yesTokens}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingDown className="w-4 h-4 mr-2 text-blue-500" />
                      <span>NO Tokens: {user.noTokens}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Wallet className="w-4 h-4 mr-2 text-purple-500" />
                      <span>ETH: {Number(user.ethBalance).toFixed(4)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Coins className="w-4 h-4 mr-2 text-yellow-500" />
                      <span>USDC: {Number(user.usdcBalance).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">{formatAddress(user.ethAddress)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(user.ethAddress);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {copiedAddress === user.ethAddress ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>

          {/* Market Resolution Section */}
          <div className="mt-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Resolve Market</h3>
                
                {!isResolved ? (
                  <div className="space-y-4">
                    <RadioGroup 
                      value={winner || ''} 
                      onValueChange={(value) => setWinner(value as 'yes' | 'no')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="yes" />
                        <Label htmlFor="yes">Yes - It rained on March 14, 2025</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no" />
                        <Label htmlFor="no">No - It did not rain on March 14, 2025</Label>
                      </div>
                    </RadioGroup>

                    <Button 
                      onClick={() => setIsResolved(true)}
                      disabled={!winner}
                      className="w-full"
                    >
                      Resolve Market
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800">
                        Market Resolved: {winner === 'yes' ? 'It rained!' : 'It did not rain!'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Results:</h4>
                      {users.map((user) => {
                        const winningTokens = winner === 'yes' ? user.yesTokens : user.noTokens;
                        const losingTokens = winner === 'yes' ? user.noTokens : user.yesTokens;
                        const hasWinningTokens = winningTokens > 0;

                        return (
                          <div 
                            key={user.id}
                            className={`p-4 rounded-lg ${
                              hasWinningTokens ? 'bg-blue-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={getAvatarUrl(user.name)}
                                  alt={user.name} 
                                  className="w-8 h-8 rounded-full bg-gray-100"
                                />
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {hasWinningTokens ? (
                                      <span className="flex items-center text-green-600">
                                        <Trophy className="w-4 h-4 mr-1" />
                                        Winner
                                      </span>
                                    ) : 'No winning tokens'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {winningTokens} {winner?.toUpperCase()} tokens
                                </p>
                                <p className="text-sm text-gray-500">
                                  {losingTokens} losing tokens
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
    </div>
  );
};