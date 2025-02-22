import { NeynarFetcher } from "../src/lib/farcaster";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';
// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
import readline from 'readline';

function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function askYesNo(question: string): Promise<boolean> {
  const rl = createPrompt();
  
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question} (y/n): `, resolve);
    });
    
    const normalizedAnswer = answer.toLowerCase().trim();
    return normalizedAnswer === 'y' || normalizedAnswer === 'yes';
  } finally {
    rl.close();
  }
}

interface SavedData {
    fetchDate: string;
    results: {
        totalCount: number;
        casts: any[];
    };
}
  
  async function saveToJson(data: SavedData) {
    const filePath = path.resolve(__dirname, '../data/mentions.json');
    await writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filePath}`);
  }
  
// Example usage:
async function main() {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
        throw new Error("API key not found. Set NEYNAR_API_KEY in your environment or .env file.");
      }
    
    const fetcher = new NeynarFetcher(apiKey);
  
    try {
      // Example: Search for mentions from the last month
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Search a single page of mentions
      const result = await fetcher.searchMentions({
        username: 'asset-trading-ch',
        startDate: sevenDaysAgo,
        // endDate,
        limit: 50,
        priorityMode: false  // Only return results from power badge users and followed users
      });
  
      console.log(`Found ${result.casts.length} mentions in the last month`);
      result.casts.forEach(cast => {
        console.log(`
          Author: ${cast.author.displayName} (@${cast.author.username})
          Text: ${cast.text}
          Time: ${cast.timestamp}
          Likes: ${cast.reactions.likes}
          Recasts: ${cast.reactions.recasts}
          Mentions: ${cast.mentions}
          Hash: ${cast.hash}
        `);
      });

    // Prepare data for saving
    const dataToSave: SavedData = {
        fetchDate: new Date().toISOString(),
        results: {
            totalCount: result.casts.length,
            casts: result.casts
        }
      };
  
      // Save to JSON file
      await saveToJson(dataToSave);
  
    } catch (error) {
      console.error('Failed to search mentions:', error);
    }
  }

main().catch(error => console.error("Error in main function:", error));