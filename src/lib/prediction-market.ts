// src/lib/usePredictionMarket.ts
import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function createMarket(string question, uint256 endTime) external returns (uint256)",
  "function buy(uint256 marketId, bool isYes, uint256 amount) external",
  "function sell(uint256 marketId, bool isYes, uint256 amount) external",
  "function resolveMarket(uint256 marketId, bool outcome) external"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export class PredictionMarketContract {
  private contract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider;
  private signerAddress: string;

  constructor(provider: ethers.JsonRpcProvider, signerAddress: string) {
    this.provider = provider;
    this.signerAddress = signerAddress;
  }

  private async getContract() {
    if (!this.contract) {
      const signer = await this.provider.getSigner(this.signerAddress);
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    return this.contract;
  }

  async createMarket(question: string): Promise<{ marketId: string; txHash: string }> {
    try {
      const contract = await this.getContract();
      const tx = await contract.createMarket(question);
      const receipt = await tx.wait();
      
      const marketCreatedEvent = receipt.logs[0];
      const marketId = marketCreatedEvent.args.marketId;

      return {
        marketId: marketId.toString(),
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Error creating market:', error);
      throw error;
    }
  }

  async tradeTokens(marketId: string, isYesToken: boolean, isBuy: boolean, amount: number): Promise<{ txHash: string }> {
    try {
      const contract = await this.getContract();
      const tx = await contract.tradeTokens(marketId, isYesToken, isBuy, amount);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw error;
    }
  }

  async resolveMarket(marketId: string, outcome: boolean): Promise<{ txHash: string }> {
    try {
      const contract = await this.getContract();
      const tx = await contract.resolveMarket(marketId, outcome);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Error resolving market:', error);
      throw error;
    }
  }

  async getMarketDetails(marketId: string): Promise<any> {
    try {
      const contract = await this.getContract();
      const tx = await contract.getMarketDetails(marketId);
      const receipt = await tx.wait();

      return {
        receipt
      };
    } catch (error) {
      console.error('Error resolving market:', error);
      throw error;
    }
  }

  async getTokenBalances(marketId: string, address: string): Promise<any> {
    try {
      const contract = await this.getContract();
      const tx = await contract.getTokenBalances(marketId, address);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Error resolving market:', error);
      throw error;
    }
  }

  async getBatchTokenBalances(marketId: string, addresses: string[]): Promise<any> {
    try {
      const contract = await this.getContract();
      const tx = await contract.getBatchTokenBalances(marketId, addresses);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Error resolving market:', error);
      throw error;
    }
  }
}