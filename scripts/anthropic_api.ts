// Node.js script to interact with Anthropic's API (ES Module version)
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Main function to get response from Claude
async function getPredictionMarketResponse(
  prompt: any, 
  model = "claude-3-5-sonnet-20241022", 
  maxTokens = 150
) {
  // Anthropic API key - set as environment variable or replace directly
  const apiKey = process.env.ANTHROPIC_API_KEY || null;
  
  if (!apiKey) {
    throw new Error("API key not found. Set ANTHROPIC_API_KEY in your environment or .env file.");
  }

  // Create a system prompt that ensures the structured response format
  const systemPrompt = `You are an AI assistant that analyzes prediction market descriptions and extracts key information.

  You MUST respond in this exact format with nothing else:

  PredictionMarketResponse:
  {
    "description": "<the inferred description for what the prediction is betting result on>",
    "collateralAddress": "<token address for the collateral token if it is given otherwise null>",
    "collateralToken": "<the ticker of the token if it is given, otherwise null>"
  }

  Do not include any other text, explanation, or formatting in your response.`;

  const headers = {
    "x-api-key": apiKey,
    "content-type": "application/json",
    "anthropic-version": "2023-06-01"
  };

  const payload = {
    model: model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      { role: "user", content: prompt }
    ]
  };
  
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      payload,
      { headers }
    );
        
    // Extract raw text response
    const rawResponse = response.data.content[0].text;
    
    // Parse the response to extract the JSON part
    const jsonMatch = rawResponse.match(/PredictionMarketResponse:\s*\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Response did not contain the expected format");
    }
    
    // Extract just the JSON object part
    const jsonPart = jsonMatch[0].replace("PredictionMarketResponse:", "").trim();
    
    // Parse and return the JSON
    return JSON.parse(jsonPart);
    
    // Extract text from the first content block
    // return response.data.content[0].text;
  } catch (error: any) {
    if (error.response) {
      return `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else {
      return `Exception occurred: ${String(error)}`;
    }
  }
}

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

// Export the function
export { getPredictionMarketResponse };