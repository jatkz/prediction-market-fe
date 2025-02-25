import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { getPredictionMarketResponse } from "../src/lib/anthropic";
import { createMarket } from './createMarket';

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

async function main() {
    const cast = await findCastByHash("0xb1c420a99ca660839bffa2b335f6ecb4aeaf0c17")
    console.log(cast);

    const parsedResponse = await getPredictionMarketResponse(cast.text);

    // dumby fix
    if (parsedResponse.collateralAddress == null) {
        parsedResponse.collateralAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // USDC sepolia
    }
    // 3rd party api get address by ticker
    // getTokenAddress(parsedResponse.collateralToken)


    
}