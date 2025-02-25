import path from 'path';
import { Web3 } from 'web3';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({path: path.resolve(process.cwd(), '.env.local') });

async function createMarket() {
  // Connect to the network
  const web3 = new Web3(process.env.RPC_URL);
  
  // Add your wallet
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY||"");
  web3.eth.accounts.wallet.add(account);
  
  console.log(`Using address: ${account.address}`);
  
  // Contract and parameters
  const contractAddress = '0xb74eBC7E97AAddbDBeD4A9427B8383B223FeCA80';
  const oracle = '0xD6139B01CDf8e2A33df49d85D128397fE8c7419b';
  const creator = account.address;
  const collateralAddress = '0x6A4b68Dca82522d15B30456ae03736aA33483789';
  const collateralAmount = web3.utils.toWei('10', 'ether');  // Adjust based on decimals
  
  // Define token contract ABI
  const tokenAbi = [
    {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},
    {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},
    {"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"},
    {"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"}
  ];
  
  // Define MarketMaker contract ABI (minimal)
  const marketMakerAbi = [
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
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "name": "poolId", "type": "bytes32"},
        {"indexed": true, "name": "oracle", "type": "address"},
        {"indexed": true, "name": "creator", "type": "address"},
        {"indexed": false, "name": "yesToken", "type": "address"},
        {"indexed": false, "name": "noToken", "type": "address"},
        {"indexed": false, "name": "state", "type": "uint8"},
        {"indexed": false, "name": "outcome", "type": "bool"},
        {"indexed": false, "name": "totalCollateral", "type": "uint256"},
        {"indexed": false, "name": "collateralAddress", "type": "address"}
      ],
      "name": "MarketCreated",
      "type": "event"
    }
  ];
  
  // Instantiate contracts
  const tokenContract = new web3.eth.Contract(tokenAbi, collateralAddress);
  const marketMakerContract = new web3.eth.Contract(marketMakerAbi, contractAddress);
  
  try {
       // Check token decimals
       const decimals = parseInt(await tokenContract.methods.decimals().call());
       console.log(`Token decimals: ${decimals}`);
       
       // Adjust amount based on actual decimals - for Web3.js v4
       const adjustedAmount = BigInt(10) * BigInt(10) ** BigInt(decimals);
       console.log(`Using adjusted amount: ${adjustedAmount.toString()}`);
       
       // Check token balance
       const balance:any = await tokenContract.methods.balanceOf(account.address).call();
       console.log(`Token balance: ${balance} (raw)`);
       
       if (BigInt(balance) < adjustedAmount) {
         throw new Error(`Insufficient token balance. Have ${balance}, need ${adjustedAmount.toString()}`);
       }
       
       // Check allowance
       const allowance:any = await tokenContract.methods.allowance(account.address, contractAddress).call();
       console.log(`Current allowance: ${allowance}`);
       
       if (BigInt(allowance) < adjustedAmount) {
         console.log('Approving tokens...');
         const approvalTx = await tokenContract.methods.approve(contractAddress, adjustedAmount.toString())
           .send({
             from: account.address,
             gas: 200000
           });
         console.log(`Approval transaction hash: ${approvalTx.transactionHash}`);
       } else {
         console.log('Token approval already sufficient');
       }
       
       // Create market
       console.log('Creating market...');
       console.log('Parameters:', {
         oracle,
         creator,
         collateralAddress,
         collateralAmount: adjustedAmount.toString()
       });
       
       // Get the raw transaction data for debugging
       const txData = marketMakerContract.methods.createMarketAndDepositCollateral(
         oracle, creator, collateralAddress, adjustedAmount.toString()
       ).encodeABI();
       console.log('Transaction data:', txData);
       
       // Send transaction
       const createTx = await marketMakerContract.methods.createMarketAndDepositCollateral(
         oracle, creator, collateralAddress, adjustedAmount.toString()
       ).send({
         from: account.address,
         gas: 5000000,
         maxFeePerGas: BigInt(2000000000), // 2 gwei
         maxPriorityFeePerGas: BigInt(1000000000) // 1 gwei
       });
       
       console.log('Transaction hash:', createTx.transactionHash);
       console.log('Transaction status:', createTx.status);
       
       // Try to extract poolId from events
       if (createTx.events && createTx.events.MarketCreated) {
         const poolId = createTx.events.MarketCreated.returnValues.poolId;
         console.log('Market created with Pool ID:', poolId);
         return { poolId, txHash: createTx.transactionHash };
       } else {
         console.log('MarketCreated event not found in transaction');
         
         // Try to get transaction receipt and parse logs manually
         const receipt = await web3.eth.getTransactionReceipt(createTx.transactionHash);
         console.log('Transaction receipt:', receipt);
         
         if (receipt.logs && receipt.logs.length > 0) {
           // Try to find the event signature for MarketCreated
           const marketCreatedSig = web3.utils.keccak256('MarketCreated(bytes32,address,address,address,address,uint8,bool,uint256,address)');
           const marketCreatedLog = receipt.logs.find(log => 
             log.topics[0] === marketCreatedSig
           );
           
           if (marketCreatedLog) {
             // The poolId is the first indexed parameter (topics[1])
             const poolId = marketCreatedLog.topics[1];
             console.log('Extracted Pool ID from logs:', poolId);
             return { poolId, txHash: createTx.transactionHash };
           }
         }
         
         console.log('Could not extract Pool ID from transaction');
         return { txHash: createTx.transactionHash };
       }
     } catch (error) {
       console.error('Error creating market:', error);
       
       if (error.message && error.message.includes('transaction underpriced')) {
         console.log('Try increasing the gas price or fee');
       }
       
       if (error.message && error.message.includes('nonce too low')) {
         console.log('Try using a different nonce - your previous transaction might still be pending');
       }
       
       throw error;
     }
   }
   
   // Execute the function
   createMarket()
     .then(result => {
       console.log('Final result:', result);
       process.exit(0);
     })
     .catch(error => {
       console.error('Fatal error:', error.message);
       process.exit(1);
     });