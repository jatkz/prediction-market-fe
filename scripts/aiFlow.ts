import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { getPredictionMarketResponse } from "../src/lib/anthropic";
import { createMarket } from './createMarket';
import * as fs from 'fs';


interface Cast {
    hash: string;
    author: {
      username: string;
      displayName: string;
      pfpUrl: string;
      fid: number;
    };
    text: string;
    timestamp: Date;
    mentions: string[];
    reactions: {
      likes: number;
      recasts: number;
    };
}  

interface SavedData {
    fetchDate: string;
    results: {
      singlePageResults: {
        totalCount: number;
        casts: any[];
      };
      allResults: {
        totalCount: number;
        casts: any[];
      };
    };
}

interface MarketResponse {
  description: string;
  poolId: string;
}


// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function findCastByHash(hash: string): Promise<Cast> {
    try {
      const filePath = path.resolve(__dirname, '../data/mentions.json');
      const fileContent = await readFile(filePath, 'utf-8');
      const data: SavedData = JSON.parse(fileContent);
  
      // Search in both single page and all results
      const singlePageCast = data.results.singlePageResults.casts
        .find(cast => cast.hash === hash);
      
      const allResultsCast = data.results.allResults.casts
        .find(cast => cast.hash === hash);

        if (data.results.singlePageResults.totalCount == 0 && data.results.allResults.totalCount == 0) {
            throw "no data"
        }
  
      // Return the first found cast or null
      return singlePageCast || allResultsCast;
  
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          console.error('mentions.json file not found');
        } else {
          console.error('Error reading file:', error.message);
        }
      }
      throw null;
    }
  }


/**
 * Saves market response data to a JSON file
 * @param responseData The market response data to save
 * @param filePath Path to save the JSON file (default: './markets.json')
 * @param append Whether to append to existing file if it exists (default: true)
 * @returns Promise that resolves with the saved file path
 */
export async function saveMarketResponseToFile(
  responseData: MarketResponse,
  filePath: string = './markets.json',
  append: boolean = true
): Promise<string> {
  try {
    // Ensure directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    let existingData: MarketResponse[] = [];
    
    // Check if file exists and we're in append mode
    if (append && fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        existingData = JSON.parse(fileContent);
        
        // Ensure the existing data is an array
        if (!Array.isArray(existingData)) {
          existingData = [existingData];
        }
      } catch (error) {
        console.warn(`Error reading existing file, starting with empty array: ${error}`);
        existingData = [];
      }
    }
    
    // Add new data
    existingData.push(responseData);
    
    // Write to file
    fs.writeFileSync(
      filePath,
      JSON.stringify(existingData, null, 2),
      'utf-8'
    );
    
    console.log(`Market data saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving market data:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Starting to find cast by hash...");
    const cast = await findCastByHash("0xb1c420a99ca660839bffa2b335f6ecb4aeaf0c17");
    
    if (!cast) {
      throw new Error("Cast not found");
    }
    
    console.log("Cast found:", cast);
    console.log("Getting prediction market response...");
    
    const parsedResponse = await getPredictionMarketResponse(cast.text);
    console.log("AI response received:", parsedResponse);
    
    // Validate the response
    if (!parsedResponse) {
      throw new Error("Failed to get a valid response from the AI");
    }
    
    // Handle missing collateral address
    let collateralAddress = parsedResponse.collateralAddress;
    if (!collateralAddress) {
      console.log("Collateral address not provided, using default USDC on Sepolia");
      collateralAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // USDC sepolia
      collateralAddress = '0x6A4b68Dca82522d15B30456ae03736aA33483789'; // currently have to use this address for our tests
    }
    
    console.log(`Creating market with collateral address: ${collateralAddress}`);
    
    // Create the market and wait for the response
    const poolId = await createMarket(collateralAddress);
    
    if (!poolId) {
      throw new Error("Failed to get poolId from market creation");
    }
    
    console.log(`Successfully created market with poolId: ${poolId}`);
    
    // Save the market data
    const marketResponse = {
      poolId,
      description: parsedResponse.description
    };
    
    const filePath = path.resolve(__dirname, '../data/markets.json');
    console.log(`Saving market data to ${filePath}`);
    
    const savedFilePath = await saveMarketResponseToFile(marketResponse, filePath);
    console.log(`File successfully saved at: ${savedFilePath}`);
    
    console.log('Operation completed successfully');
    // return { success: true, poolId, description: parsedResponse.description };
  } catch (error) {
    console.error("Error in main function:", error);
    throw error; // Re-throw to be caught by the promise chain
  }
}

// Execute the function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });