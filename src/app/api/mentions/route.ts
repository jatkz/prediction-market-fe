// app/api/mentions/route.ts
import { TwitterApi, TweetV2, UserV2 } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const maxResults = Number(searchParams.get('maxResults')) || 100;

  if (!username) {
    return NextResponse.json(
      { error: 'Username parameter is required' },
      { status: 400 }
    );
  }

  try {
    const query = `@${username.replace('@', '')} -from:${username}`;
    
    const searchResult = await client.v2.search({
        query,
        max_results: maxResults,
        'tweet.fields': ['created_at', 'author_id', 'text', 'public_metrics'],
        expansions: ['author_id'],
        'user.fields': ['username', 'name', 'profile_image_url'],
      });

    const tweets = searchResult.data.data || [];
    const users = searchResult.includes?.users || [];

    const mentions = tweets.map((tweet: TweetV2) => {
      const author = users.find((u: UserV2) => u.id === tweet.author_id);
      
      return {
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        author: {
          id: tweet.author_id,
          username: author?.username,
          name: author?.name,
          profile_image_url: author?.profile_image_url,
        },
        metrics: tweet.public_metrics
      };
    });

    return NextResponse.json({ mentions });
  } catch (error: any) {
    console.error('Error fetching mentions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentions' },
      { status: 500 }
    );
  }
}