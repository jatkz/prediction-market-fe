// src/hooks/usePredictionMarket.ts
import { useState } from 'react';
import { ethers } from 'ethers';
import { PredictionMarketContract } from '@/lib/prediction-market';

interface ContractError {
  code: string;
  message: string;
}

export function usePredictionMarket(signerAddress: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ContractError | null>(null);

  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
  const contract = new PredictionMarketContract(provider, signerAddress);

  const handleContractError = (error: any) => {
    console.error('Contract error:', error);
    setError({
      code: error.code || 'UNKNOWN',
      message: error.message || 'An unknown error occurred'
    });
    setIsLoading(false);
  };

  const createMarket = async (question: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await contract.createMarket(question);
      setIsLoading(false);
      return result;
    } catch (error: any) {
      handleContractError(error);
      throw error;
    }
  };

  const tradeTokens = async (marketId: string, isYesToken: boolean, isBuy: boolean, amount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await contract.tradeTokens(marketId, isYesToken, isBuy, amount);
      setIsLoading(false);
      return result;
    } catch (error: any) {
      handleContractError(error);
      throw error;
    }
  };

  const resolveMarket = async (marketId: string, outcome: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await contract.resolveMarket(marketId, outcome);
      setIsLoading(false);
      return result;
    } catch (error: any) {
      handleContractError(error);
      throw error;
    }
  };

  const getMarketDetails = async (marketId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await contract.getMarketDetails(marketId);
      setIsLoading(false);
      return result;
    } catch (error: any) {
      handleContractError(error);
      throw error;
    }
  };

  const getTokenBalances = async (marketId: string, address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await contract.getTokenBalances(marketId, address);
      setIsLoading(false);
      return result;
    } catch (error: any) {
      handleContractError(error);
      throw error;
    }
  };

  const getBatchTokenBalances = async (marketId: string, addresses: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await contract.getBatchTokenBalances(marketId, addresses);
      setIsLoading(false);
      return result;
    } catch (error: any) {
      handleContractError(error);
      throw error;
    }
  };

  return {
    isLoading,
    error,
    createMarket,
    tradeTokens,
    resolveMarket,
    getMarketDetails,
    getTokenBalances,
    getBatchTokenBalances
  };
}