import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({path: path.resolve(process.cwd(), '.env.local') });

async function createMarket() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY||"", provider);
  
  console.log(`Using address: ${wallet.address}`);
  
  // Parameters for createMarketAndDepositCollateral
  const contractAddress = '0xb74eBC7E97AAddbDBeD4A9427B8383B223FeCA80';
  const oracle = '0xD6139B01CDf8e2A33df49d85D128397fE8c7419b';
  const creator = wallet.address;
  console.log('creator:', creator);
  const collateralAddress = '0x6A4b68Dca82522d15B30456ae03736aA33483789';
  const collateralAmount = ethers.parseUnits('6', 6);
  
  // Check ETH balance first
  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
  
  // Now check the token balance
  const erc20Interface = new ethers.Interface([
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)'
  ]);
  
  const tokenContract = new ethers.Contract(collateralAddress, erc20Interface, wallet);
  
  try {
    // Get token decimals
    const decimals = await tokenContract.decimals();
    console.log(`Token decimals: ${decimals}`);
    
    // Check token balance
    const tokenBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`Token balance: ${ethers.formatUnits(tokenBalance, decimals)} tokens`);
    
    if (tokenBalance < collateralAmount) {
      console.error(`Insufficient token balance. Have ${ethers.formatUnits(tokenBalance, decimals)}, need ${ethers.formatUnits(collateralAmount, decimals)}`);
      throw new Error('Insufficient token balance');
    }
    
    // Check allowance
    const allowance = await tokenContract.allowance(wallet.address, contractAddress);
    console.log(`Current allowance: ${ethers.formatUnits(allowance, decimals)} tokens`);
    
    if (allowance < collateralAmount) {
      console.log('Need to approve tokens...');
      const approvalTx = await tokenContract.approve(contractAddress, collateralAmount);
      console.log(`Approval transaction submitted: ${approvalTx.hash}`);
      const approvalReceipt = await approvalTx.wait();
      console.log(`Approval transaction confirmed: ${approvalReceipt.hash}, status: ${approvalReceipt.status}`);
    } else {
      console.log('Token approval already sufficient');
    }
    
    // Now proceed with the market creation
    const marketMakerHookABI = [
      {
        "inputs": [
          {"name": "oracle", "type": "address"},
          {"name": "creator", "type": "address"},
          {"name": "collateralAddress", "type": "address"},
          {"name": "collateralAmount", "type": "uint256"}
        ],
        "name": "createMarketAndDepositCollateral",
        "outputs": [{"name": "", "type": "bytes32"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    const iface = new ethers.Interface(marketMakerHookABI);
    
    // Encode the function data
    const data = iface.encodeFunctionData(
      'createMarketAndDepositCollateral',
      [oracle, creator, collateralAddress, collateralAmount]
    );
    
    console.log('Encoded function data:', data);
    
    // Create a raw transaction
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log('Using nonce:', nonce);
    
    const tx = {
      to: contractAddress,
      from: wallet.address,
      nonce,
      data,
      gasLimit: 5000000,
      type: 2,  // Use EIP-1559 transaction
      maxFeePerGas: ethers.parseUnits('2', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
      chainId: (await provider.getNetwork()).chainId
    };
    
    // Send the transaction
    const signedTx = await wallet.signTransaction(tx);
    console.log('Signed transaction:', signedTx);
    
    const txResponse = await provider.broadcastTransaction(signedTx);
    console.log('Transaction response:', txResponse);
    
    console.log('Waiting for confirmation...');
    const receipt = await txResponse.wait();
    console.log('Transaction receipt:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error creating market:', error);
    
    if (error.transaction) {
      console.error('Transaction in error:', error.transaction);
    }
    
    if (error.reason) {
      console.error('Error reason:', error.reason);
    }
    
    // Try to get more information
    if (error.code === 'CALL_EXCEPTION' && error.receipt) {
      console.log('Transaction reverted. This could be due to:');
      console.log('1. Insufficient token balance or approval');
      console.log('2. Contract permissions (only specific addresses may be allowed to create markets)');
      console.log('3. Contract requirements not met (check the contract code for specific conditions)');
      console.log('4. For this Uniswap v4 hook, there may be specific initialization or integration requirements');
    }
    
    throw error;
  }
}

// Execute the function
createMarket()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });