// Node.js script to interact with Anthropic's API (ES Module version)
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPredictionMarketResponse } from "../src/lib/anthropic";

// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Example usage
async function main() {
  // Test all 3 cases
  // const marketExample = "Will ETH price exceed $3000 by the end of March? Betting with USDC (0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)";
  // const marketExample = "Will ETH price exceed $3000 by the end of March? Betting with USDC";
  const marketExample = "Will ETH price exceed $3000 by the end of March? Use 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
   
  console.log("Analyzing prediction market...");
  const response = await getPredictionMarketResponse(marketExample);
  console.log("\nStructured Response:");
  console.log(JSON.stringify(response, null, 2));
}

// Run the example
main().catch(error => console.error("Error in main function:", error));