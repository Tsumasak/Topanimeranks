'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface AnimeExternalLinksProps {
  anime: any;
}

export function AnimeExternalLinks({ anime }: AnimeExternalLinksProps) {
  const malLink = `https://myanimelist.net/anime/${anime.anime_id}`;

  // Get official and streaming links from Jikan data
  const officialLinks = anime.external?.filter(
    (link: any) => link.name?.toLowerCase().includes('official')
  ) || [];
  
  const streamingLinks = anime.streaming || [];

  return (
    <div className="theme-card rounded-lg p-6 border">
      <h2 className="text-2xl mb-4" style={{ color: 'var(--foreground)' }}>External Links</h2>

      <div className="space-y-3">
        {/* MyAnimeList */}
        <a
          href={malLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full justify-start">
            <span className="mr-2">🌐</span>
            MyAnimeList
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
        </a>

        {/* Official Site */}
        {officialLinks.map((link: any, index: number) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full justify-start">
              <span className="mr-2">📺</span>
              Official Site
              <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
          </a>
        ))}

        {/* Streaming Links */}
        {streamingLinks.map((link: any, index: number) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full justify-start">
              <span className="mr-2">▶️</span>
              {link.name}
              <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
          </a>
        ))}
      </div>
    </div>
  );
}