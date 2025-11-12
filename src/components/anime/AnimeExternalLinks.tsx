'use client';

import { ExternalLink } from 'lucide-react';

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
    <div 
      className="rounded-lg p-6 border shadow-md"
      style={{
        background: "var(--card-background)",
        borderColor: "var(--card-border)",
      }}
    >
      <h2 className="text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
        <span>🔗</span>
        External Links
      </h2>

      <div className="space-y-3">
        {/* MyAnimeList */}
        <a
          href={malLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div 
            className="w-full flex items-center justify-start rounded-md border px-4 py-2.5 text-sm hover:shadow-[0_10px_15px_-3px_var(--shadow-hover)] hover:-translate-y-[2px]"
            style={{
              borderColor: "var(--card-border)",
              color: "var(--foreground)",
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <span className="mr-2">🌐</span>
            MyAnimeList
            <ExternalLink className="ml-auto h-4 w-4" />
          </div>
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
            <div 
              className="w-full flex items-center justify-start rounded-md border px-4 py-2.5 text-sm hover:shadow-[0_10px_15px_-3px_var(--shadow-hover)] hover:-translate-y-[2px]"
              style={{
                borderColor: "var(--card-border)",
                color: "var(--foreground)",
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span className="mr-2">📺</span>
              Official Site
              <ExternalLink className="ml-auto h-4 w-4" />
            </div>
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
            <div 
              className="w-full flex items-center justify-start rounded-md border px-4 py-2.5 text-sm hover:shadow-[0_10px_15px_-3px_var(--shadow-hover)] hover:-translate-y-[2px]"
              style={{
                borderColor: "var(--card-border)",
                color: "var(--foreground)",
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span className="mr-2">▶️</span>
              {link.name}
              <ExternalLink className="ml-auto h-4 w-4" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}