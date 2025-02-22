import axios from 'axios';

interface SearchMentionsOptions {
  username: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  cursor?: string;
  viewerFid?: number;
  priorityMode?: boolean;
}

interface Author {
  username: string;
  displayName: string;
  pfpUrl: string;
  fid: number;
}

interface Cast {
  hash: string;
  author: Author;
  text: string;
  timestamp: Date;
  mentions: string[];
  reactions: {
    likes: number;
    recasts: number;
  };
}

class NeynarFetcher {
  private readonly apiKey: string;
  private readonly client: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.neynar.com/v2/farcaster',
      headers: {
        'accept': 'application/json',
        'api_key': this.apiKey
      }
    });
  }

  private buildSearchQuery(username: string, startDate?: Date, endDate?: Date): string {
    const parts = [`@${username}`];

    if (startDate) {
      const afterDate = startDate.toISOString().split('T')[0];
      parts.push(`after:${afterDate}`);
    }

    if (endDate) {
      const beforeDate = endDate.toISOString().split('T')[0];
      parts.push(`before:${beforeDate}`);
    }

    return parts.join(' ');
  }

  async searchMentions({ 
    username,
    startDate,
    endDate,
    limit = 25,
    cursor,
    viewerFid,
    priorityMode = false
  }: SearchMentionsOptions): Promise<{
    casts: Cast[];
    nextCursor?: string;
  }> {
    try {
      const query = this.buildSearchQuery(username, startDate, endDate);

      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        ...(cursor && { cursor }),
        ...(viewerFid && { viewer_fid: viewerFid.toString() }),
        ...(priorityMode && { priority_mode: 'true' })
      });

      const response = await this.client.get(`/cast/search?${params.toString()}`);
      const { result } = response.data;

      const casts = result.casts.map((cast: any) => ({
        hash: cast.hash,
        author: {
          username: cast.author.username,
          displayName: cast.author.display_name,
          pfpUrl: cast.author.pfp_url,
          fid: cast.author.fid
        },
        text: cast.text,
        timestamp: new Date(cast.timestamp),
        mentions: cast.mentions.map((m: any) => m.username),
        reactions: {
          likes: cast.reactions.likes,
          recasts: cast.reactions.recasts
        }
      }));

      return {
        casts,
        nextCursor: result.next?.cursor
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data || error.message);
      } else {
        console.error('Error:', error);
      }
      throw error;
    }
  }

  async searchAllMentions(options: SearchMentionsOptions): Promise<Cast[]> {
    const allCasts: Cast[] = [];
    let cursor: string | undefined = options.cursor;

    while (true) {
      const result = await this.searchMentions({
        ...options,
        cursor
      });

      allCasts.push(...result.casts);

      if (!result.nextCursor || result.casts.length === 0) {
        break;
      }

      cursor = result.nextCursor;
    }

    return allCasts;
  }
}

export { NeynarFetcher, type SearchMentionsOptions, type Cast, type Author };