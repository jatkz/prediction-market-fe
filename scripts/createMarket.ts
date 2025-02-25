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
    const erc20 = new ethers.Contract(
      collateralAddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)'
      ],
      wallet
    );
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
    
    console.log('Contract params:', {
        oracle,
        creator,
        collateralAddress,
        collateralAmount: collateralAmount.toString()
      });
    // When calling the function, log the contract address and ABI
    console.log('Contract address:', MARKET_MAKER_HOOK_ADDRESS);
    console.log('Using function:', marketMakerHook.interface.getFunction('createMarketAndDepositCollateral'));

    // Call the contract function
    // const tx = await marketMakerHook.createMarketAndDepositCollateral(
    //   oracle,
    //   creator,
    //   collateralAddress,
    //   collateralAmount,
    //   { gasLimit: 3000000 } // Add a safe gas limit
    // );

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
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Extract poolId from events (assuming it's returned in an event)
    const event = receipt.logs
      .map((log:any) => {
        try {
          return marketMakerHook.interface.parseLog(log);
        } catch (e) {
            console.log('error does in logs');
            console.log(e);
          return null;
        }
      })
      .find((event:any) => event && event.name === 'MarketCreated');

    if (event && event.args) {
      const poolId = event.args[0]; // First indexed parameter should be poolId
      console.log(`Market created with pool ID: ${poolId}`);
    }
    
    return receipt;
  } catch (error) {
    console.error('Error creating market:', error);
    throw error;
  }
}

// Execute the function
createMarket()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });