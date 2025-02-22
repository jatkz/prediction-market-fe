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
async function getClaudeResponse(
  prompt: any, 
  model = "claude-3-5-sonnet-20241022", 
  maxTokens = 150
) {
  // Anthropic API key - set as environment variable or replace directly
  const apiKey = process.env.ANTHROPIC_API_KEY || "YOUR_API_KEY_HERE";
  
  const headers = {
    "x-api-key": apiKey,
    "content-type": "application/json",
    "anthropic-version": "2023-06-01"
  };

  const payload = {
    model: model,
    max_tokens: maxTokens,
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
    
    // Extract text from the first content block
    return response.data.content[0].text;
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
  const userPrompt = "Say hi back to me.";
  
  console.log("Sending prompt to Claude...");
  const response = await getClaudeResponse(userPrompt);
  console.log("\nClaude's response:");
  console.log(response);
}

// Run the example
main().catch(error => console.error("Error in main function:", error));

// Export the function
export { getClaudeResponse };