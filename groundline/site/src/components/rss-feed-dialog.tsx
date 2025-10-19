"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rss, CheckCircle, AlertCircle, Loader2, X, Trash2, ExternalLink, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RSSFeed {
  id: string;
  url: string;
  name?: string;
  addedAt: number;
  lastFetched?: number;
  status?: 'active' | 'error' | 'pending';
}

interface FetchResult {
  success: boolean;
  message?: string;
  itemsCount?: number;
  error?: string;
}

const RSS_STORAGE_KEY = 'groundline_rss_feeds';

export function RSSFeedDialog() {
  const [open, setOpen] = useState(false);
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);

  // Load feeds from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFeeds = localStorage.getItem(RSS_STORAGE_KEY);
      if (storedFeeds) {
        try {
          setFeeds(JSON.parse(storedFeeds));
        } catch (error) {
          console.error('Error parsing stored feeds:', error);
        }
      }
    }
  }, []);

  // Save feeds to localStorage whenever they change
  const saveFeeds = (updatedFeeds: RSSFeed[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(RSS_STORAGE_KEY, JSON.stringify(updatedFeeds));
      setFeeds(updatedFeeds);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addFeed = () => {
    if (!newFeedUrl.trim()) return;

    if (!isValidUrl(newFeedUrl)) {
      setFetchResult({
        success: false,
        error: 'Please enter a valid URL'
      });
      return;
    }

    // Check for duplicates
    if (feeds.some(feed => feed.url === newFeedUrl)) {
      setFetchResult({
        success: false,
        error: 'This feed is already added'
      });
      return;
    }

    const newFeed: RSSFeed = {
      id: Date.now().toString(),
      url: newFeedUrl,
      addedAt: Date.now(),
      status: 'pending'
    };

    const updatedFeeds = [...feeds, newFeed];
    saveFeeds(updatedFeeds);
    setNewFeedUrl("");
    setFetchResult({
      success: true,
      message: 'Feed added successfully'
    });

    // Auto-clear success message after 3 seconds
    setTimeout(() => setFetchResult(null), 3000);
  };

  const removeFeed = (id: string) => {
    const updatedFeeds = feeds.filter(feed => feed.id !== id);
    saveFeeds(updatedFeeds);
  };

  const fetchFeed = async (feedUrl: string) => {
    setIsFetching(true);
    setFetchResult(null);

    try {
      // Call API to fetch and process RSS feed
      const response = await fetch('/api/rss-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: feedUrl }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update feed status
        const updatedFeeds = feeds.map(feed =>
          feed.url === feedUrl
            ? { ...feed, lastFetched: Date.now(), status: 'active' as const }
            : feed
        );
        saveFeeds(updatedFeeds);

        setFetchResult({
          success: true,
          message: 'Feed fetched and processed successfully',
          itemsCount: result.itemsCount
        });
      } else {
        // Update feed status to error
        const updatedFeeds = feeds.map(feed =>
          feed.url === feedUrl
            ? { ...feed, status: 'error' as const }
            : feed
        );
        saveFeeds(updatedFeeds);

        setFetchResult({
          success: false,
          error: result.error || 'Failed to fetch feed'
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setFetchResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch feed'
      });

      // Update feed status to error
      const updatedFeeds = feeds.map(feed =>
        feed.url === feedUrl
          ? { ...feed, status: 'error' as const }
          : feed
      );
      saveFeeds(updatedFeeds);
    } finally {
      setIsFetching(false);
    }
  };

  const clearAllFeeds = () => {
    if (confirm('Are you sure you want to remove all RSS feeds?')) {
      saveFeeds([]);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full px-4 py-2 border border-foreground/20 rounded text-sm hover:bg-foreground/5 transition-colors flex items-center justify-center gap-2">
          <Rss className="w-4 h-4" />
          Manage Feeds
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">RSS Feed Connector</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Feed */}
          <Card className="p-4 bg-muted/50">
            <Label htmlFor="feed-url" className="text-base font-medium mb-3 block">
              Add RSS Feed
            </Label>
            <div className="flex gap-2">
              <Input
                id="feed-url"
                type="url"
                placeholder="https://example.com/feed.xml"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFeed()}
                className="flex-1"
              />
              <Button onClick={addFeed} className="font-mono uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter the URL of an RSS or Atom feed to monitor
            </p>
          </Card>

          {/* Fetch Result Messages */}
          {fetchResult && (
            <Card className={`p-4 ${fetchResult.success ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-2">
                {fetchResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className="text-sm font-medium">
                  {fetchResult.success ? fetchResult.message : fetchResult.error}
                </p>
                {fetchResult.itemsCount && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    ({fetchResult.itemsCount} items)
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* Feeds List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Saved Feeds ({feeds.length})
              </h3>
              {feeds.length > 0 && (
                <Button
                  onClick={clearAllFeeds}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {feeds.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <Rss className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No RSS feeds added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first feed above to get started
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {feeds.map((feed) => (
                  <Card key={feed.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0">
                        <Rss className="w-5 h-5 text-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <a
                              href={feed.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:underline flex items-center gap-1 break-all"
                            >
                              {feed.url}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">
                              Added {formatDate(feed.addedAt)}
                              {feed.lastFetched && ` • Last fetched ${formatDate(feed.lastFetched)}`}
                            </p>
                          </div>
                          
                          {feed.status && (
                            <span
                              className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded flex-shrink-0 ${
                                feed.status === 'active'
                                  ? 'bg-green-500/10 text-green-600'
                                  : feed.status === 'error'
                                  ? 'bg-red-500/10 text-red-600'
                                  : 'bg-orange-500/10 text-orange-600'
                              }`}
                            >
                              {feed.status}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => fetchFeed(feed.url)}
                            disabled={isFetching}
                            size="sm"
                            variant="outline"
                            className="text-xs font-mono uppercase tracking-wider"
                          >
                            {isFetching ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Fetching...
                              </>
                            ) : (
                              <>
                                <Rss className="w-3 h-3 mr-1" />
                                Fetch Now
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => removeFeed(feed.id)}
                            size="sm"
                            variant="ghost"
                            className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>How it works:</strong> RSS feeds are stored locally in your browser. 
              Click "Fetch Now" to retrieve the latest content and process it into the knowledge graph. 
              Feeds are automatically stored using browser localStorage for persistence.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

