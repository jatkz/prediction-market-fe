import axios from 'axios';

interface PredictionMarketResponse
{
  description: string,
  collateralAddress: string|null,
  collateralToken: string|null
}

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
      const parsed: PredictionMarketResponse = JSON.parse(jsonPart);
      parsed.collateralAddress = parsed.collateralAddress == 'null' ? null : parsed.collateralAddress;
      parsed.collateralToken = parsed.collateralToken == 'null' ? null : parsed.collateralToken;

      return parsed
    } catch (error: any) {
      if (error.response) {
        throw `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else {
        throw `Exception occurred: ${String(error)}`;
      }
    }
  }

export { getPredictionMarketResponse };