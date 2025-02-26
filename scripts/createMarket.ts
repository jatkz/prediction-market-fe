import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import MarketMakerHookABI from '../src/contracts/abis/MarketMakerHook.json';
import { ContractAddresses } from '../src/contracts/index';
import path from 'path';

// Load environment variables
dotenv.config({path: path.resolve(process.cwd(), '.env.local') });

// Contract address - store in .env file for security
const MARKET_MAKER_HOOK_ADDRESS = process.env.MARKET_MAKER_HOOK_ADDRESS || ContractAddresses.MarketMakerHook;
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

export async function createMarket(collateralTokenAddress?: string|undefined) {
  console.log('Address', collateralTokenAddress);

  // Create provider and signer - ethers v6 syntax
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`Using address: ${wallet.address}`);
  
  // Initialize contract
  const marketMakerHook = new ethers.Contract(
    MARKET_MAKER_HOOK_ADDRESS,
    MarketMakerHookABI.abi,
    wallet
  );
  
  // Parameters for createMarketAndDepositCollateral
  const oracle = '0xD6139B01CDf8e2A33df49d85D128397fE8c7419b'; // Address of the oracle
  const creator = wallet.address; // Using your wallet as the creator
  const collateralAddress = collateralTokenAddress||'0x6A4b68Dca82522d15B30456ae03736aA33483789'; // ERC20 token to use as collateral
  const collateralAmount = ethers.parseUnits('10', 6); // Amount of collateral (10 tokens with 18 decimals)
  
  console.log('Creating market...');
  
  try {
    // First approve the MarketMakerHook to spend your tokens if using ERC20 as collateral
    const erc20Interface = new ethers.Interface([
        'function balanceOf(address account) view returns (uint256)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)'
      ]);
    const tokenContract = new ethers.Contract(collateralAddress, erc20Interface, wallet);
  
    
    const decimals = await tokenContract.decimals();
    console.log(`Token decimals: ${decimals}`);
    
    // Check token balance
    const tokenBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`Token balance: ${ethers.formatUnits(tokenBalance, decimals)} tokens`);
    if (tokenBalance < collateralAmount) {
        console.error(`Insufficient token balance. Have ${ethers.formatUnits(tokenBalance, decimals)}, need ${ethers.formatUnits(collateralAmount, decimals)}`);
        throw new Error('Insufficient token balance');
      }
    
    // Check if approval is needed
    const allowance = await tokenContract.allowance(wallet.address, MARKET_MAKER_HOOK_ADDRESS);
    console.log(`Current allowance: ${ethers.formatUnits(allowance, decimals)} tokens`);

    if (allowance < collateralAmount) {
      console.log('Approving tokens...');
      const approveTx = await tokenContract.approve(MARKET_MAKER_HOOK_ADDRESS, collateralAmount);
      await approveTx.wait();
      console.log(`Approval transaction: ${approveTx.hash}`);
    }

    const data = marketMakerHook.interface.encodeFunctionData(
        'createMarketAndDepositCollateral',
        [oracle, creator, collateralAddress, collateralAmount]
      );
      
      console.log('Encoded function data:', data);
      
      // Create and send the transaction manually
      const tx = await wallet.sendTransaction({
        to: MARKET_MAKER_HOOK_ADDRESS,
        data: data,
        gasLimit: 5000000
      });
    
    console.log(`Transaction submitted: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await waitForTransactionWithRetry(provider, tx.hash);

    if (receipt) {
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
            
      // After getting the receipt
      const txLogs = await provider.getLogs({
        blockHash: receipt.blockHash
      });

      // Filter logs for only those from your transaction
      const txSpecificLogs = txLogs.filter(log => log.transactionHash === receipt.hash);

      // After getting the receipt and logs
      const marketCreatedEventSignature = '0x1cbee7c4e3c575e7f2c0fbc27b89ce2a0636ffa1f47983b91719c42d5d8e1886';

      // Find the log with this event signature
      const marketCreatedLog = txSpecificLogs.find(
        log => log.topics[0] === marketCreatedEventSignature &&
              log.address.toLowerCase() === MARKET_MAKER_HOOK_ADDRESS.toLowerCase()
      );

      if (marketCreatedLog) {
        // The poolId is likely in the data field
        // Assuming the event structure has the poolId as the last parameter
        const poolId = marketCreatedLog.data.slice(-64); // Last 32 bytes (64 hex chars)
        console.log(`Market created with pool ID: 0x${poolId}`);

        // Now you can use this poolId to call the markets function
        const formattedPoolId = poolId.startsWith('0x') ? poolId : `0x${poolId}`;
        const market = await marketMakerHook.markets(formattedPoolId);
        // const market = await marketMakerHook.markets(poolId);
        console.log("Market details:", market);
      
        return poolId;
      }
    } else {
      console.log('no receipt :(')
    }
  } catch (error) {
    console.error('Error creating market:', error);
    throw error;
  }
}

/**
 * Waits for a transaction receipt with timeout and retry mechanism
 * @param provider The ethers.js provider
 * @param txHash The transaction hash to check
 * @param timeoutMs Timeout in milliseconds before retrying (default: 5000ms)
 * @param maxRetries Maximum number of retries (default: 5)
 * @param retryDelayMs Delay between retries in milliseconds (default: 1000ms)
 * @returns The transaction receipt or null if it couldn't be retrieved after retries
 */
async function waitForTransactionWithRetry(
  provider: ethers.Provider,
  txHash: string,
  timeoutMs: number = 5000,
  maxRetries: number = 5,
  retryDelayMs: number = 5000
): Promise<ethers.TransactionReceipt | null> {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // Create a promise for the transaction receipt
      const receiptPromise = provider.getTransactionReceipt(txHash);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Transaction receipt timeout')), timeoutMs);
      });
      
      // Race the promises - whichever resolves/rejects first wins
      const receipt = await Promise.race([
        receiptPromise,
        timeoutPromise
      ]) as ethers.TransactionReceipt | null;
      
      // If we got a receipt, return it
      if (receipt) {
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        return receipt;
      }
      
      // If no receipt but no timeout, the transaction is still pending
      console.log(`No receipt yet, transaction still pending...`);
      throw "catch error flow";
    } catch (error) {
      // If we timed out or got another error
      retries++;
      
      if (retries > maxRetries) {
        console.error(`Max retries (${maxRetries}) reached for transaction ${txHash}`);
        return null;
      }
      
      console.log(`Retry ${retries}/${maxRetries} for transaction ${txHash}`);
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  
  return null;
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

// Only run this if it's being executed directly, not when imported
if (isMainModule) {
  createMarket()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}