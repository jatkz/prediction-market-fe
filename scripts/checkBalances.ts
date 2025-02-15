// scripts/checkBalances.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// USDC Contract ABI (minimal for balance checking)
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Sepolia configurations
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY";
const USDC_CONTRACT_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

async function checkBalances() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);

  const traders = ['ALICE', 'BOB', 'CHARLIE', 'DIANA'];

  console.log('Checking balances on Sepolia testnet...\n');

  for (const trader of traders) {
    const address = process.env[`NEXT_PUBLIC_${trader}_PUBLIC_KEY`];
    if (!address) {
      console.log(`No address found for ${trader}`);
      continue;
    }

    try {
      // Check ETH balance
      const ethBalance = await provider.getBalance(address);
      const ethBalanceInEther = ethers.formatEther(ethBalance);

      // Check USDC balance
      const usdcBalance = await usdcContract.balanceOf(address);
      const usdcDecimals = await usdcContract.decimals();
      const usdcBalanceFormatted = ethers.formatUnits(usdcBalance, usdcDecimals);

      console.log(`${trader}:`);
      console.log(`Address: ${address}`);
      console.log(`ETH Balance: ${ethBalanceInEther} SepoliaETH`);
      console.log(`USDC Balance: ${usdcBalanceFormatted} TestUSDC`);
      console.log('');

      // If balance is low, provide faucet links
      if (parseFloat(ethBalanceInEther) < 0.1) {
        console.log('Low ETH Balance! Get test ETH from:');
        console.log('- Alchemy Faucet: https://sepoliafaucet.com/');
        console.log('- Infura Faucet: https://www.infura.io/faucet/sepolia');
        console.log('');
      }
    } catch (error) {
      console.error(`Error checking balances for ${trader}:`, error);
    }
  }
}

checkBalances().catch(console.error);