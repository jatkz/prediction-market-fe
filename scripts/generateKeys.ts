// generateKeys.js
import { ethers } from 'ethers';

function generateKeyPairs() {
  const traders = ['ALICE', 'BOB', 'CHARLIE', 'DIANA'];
  
  console.log('Generated Key Pairs:');
  console.log('\nAdd these to your .env.local file:\n');
  
  traders.forEach((trader) => {
    const wallet = ethers.Wallet.createRandom();
    
    console.log(`# ${trader}`);
    console.log(`${trader}_PRIVATE_KEY="${wallet.privateKey}"`);
    console.log(`${trader}_PUBLIC_KEY="${wallet.address}"`);
    console.log('');
  });
}

generateKeyPairs();