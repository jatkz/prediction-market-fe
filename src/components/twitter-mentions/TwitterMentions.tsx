import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, MessageCircle, Heart, Repeat } from 'lucide-react';

interface TweetMetrics {
  reply_count: number;
  retweet_count: number;
  like_count: number;
}

interface TweetAuthor {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author: TweetAuthor;
  metrics?: TweetMetrics;
}

interface ApiResponse {
  mentions: Tweet[];
  error?: string;
}

export default function TwitterMentions() {
  const [username, setUsername] = useState<string>('');
  const [mentions, setMentions] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchMentions = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/mentions?username=${username}`);
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch mentions');
      }

      setMentions(data.mentions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Twitter Mentions Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Enter Twitter username"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={fetchMentions}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</>
              ) : (
                'Fetch Mentions'
              )}
            </Button>
          </div>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {mentions.length > 0 && (
        <div className="space-y-4">
          {mentions.map((mention) => (
            <Card key={mention.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <img
                    src={mention.author.profile_image_url || '/api/placeholder/48/48'}
                    alt={`${mention.author.username}'s profile`}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{mention.author.name}</span>
                      <span className="text-gray-500">@{mention.author.username}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500">{formatDate(mention.created_at)}</span>
                    </div>
                    <p className="mt-2">{mention.text}</p>
                    {mention.metrics && (
                      <div className="flex gap-6 mt-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {mention.metrics.reply_count}
                        </div>
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          {mention.metrics.retweet_count}
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          {mention.metrics.like_count}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}