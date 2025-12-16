'use client';

import React from 'react';
import { useState } from 'react';
import { X, Play } from 'lucide-react';

interface Video {
  title: string;
  trailer: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
    images: {
      image_url: string | null;
      small_image_url: string | null;
      medium_image_url: string | null;
      large_image_url: string | null;
      maximum_image_url: string | null;
    };
  };
}

interface VideoCategory {
  promo: Video[];
  music_videos: Video[];
  episodes?: Video[];
}

interface AnimeVideosProps {
  videos: VideoCategory;
  animeTitle?: string;
}

export function AnimeVideos({ videos, animeTitle = 'Anime' }: AnimeVideosProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string): string => {
    if (!url || url.trim() === '') {
      console.error('Error: No URL provided');
      return '';
    }
    
    console.log('[AnimeVideos] Processing URL:', url);
    
    try {
      // Check if it's already a valid URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.error('Error parsing YouTube URL: URL does not start with http(s)://', url);
        // Try to fix it by adding https://
        url = 'https://' + url;
      }
      
      // Extract video ID from various YouTube URL formats
      const urlObj = new URL(url);
      let videoId = null;
      
      // Handle youtube.com/watch?v=ID or youtube-nocookie.com/watch?v=ID
      if ((urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtube-nocookie.com')) && urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v');
      }
      // Handle youtu.be/ID
      else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1).split('?')[0]; // Remove query params
      }
      // Handle already embedded URLs: /embed/VIDEO_ID
      else if (url.includes('/embed/')) {
        // Extract video ID from embed URL
        // Format: https://www.youtube-nocookie.com/embed/pv8A7eubPQQ?enablejsapi=1&wmode=opaque&autoplay=1
        const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        if (embedMatch && embedMatch[1]) {
          videoId = embedMatch[1];
        }
      }
      
      if (videoId) {
        console.log('[AnimeVideos] Extracted video ID:', videoId);
        return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&wmode=opaque`;
      }
      
      // Fallback - return original URL if we couldn't extract ID
      console.warn('[AnimeVideos] Could not extract video ID, using original URL:', url);
      return url;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error, 'URL:', url);
      // Return the original URL as fallback instead of empty string
      return url;
    }
  };

  // Get YouTube thumbnail from video ID
  const getYouTubeThumbnail = (embedUrl: string): string => {
    try {
      const embedMatch = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch && embedMatch[1]) {
        const videoId = embedMatch[1];
        // Use maxresdefault for highest quality, fallback to hqdefault
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } catch (error) {
      console.error('Error extracting thumbnail:', error);
    }
    return 'https://via.placeholder.com/640x360?text=No+Thumbnail';
  };

  const openVideoModal = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsModalOpen(false);
    // Small delay before clearing to allow fade-out animation
    setTimeout(() => setSelectedVideo(null), 300);
  };

  // Combine all videos into a single array with category labels
  const allVideos: Array<Video & { category: string }> = [
    ...(videos?.promo || []).map(v => ({ ...v, category: 'Trailer & Promo' })),
    ...(videos?.music_videos || []).map(v => ({ ...v, category: 'Music Video' })),
    ...(videos?.episodes || []).map(v => ({ ...v, category: 'Episode Preview' })),
  ].filter(video => {
    // Check if embed_url exists and is valid
    const embedUrl = video.trailer?.embed_url;
    return embedUrl && embedUrl.trim() !== '';
  });

  if (allVideos.length === 0) {
    return (
      <div 
        className="rounded-lg p-6 border shadow-md"
        style={{
          background: "var(--card-background)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2 className="text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <span>🎥</span>
          Videos
        </h2>
        <p style={{ color: 'var(--rating-text)' }}>No videos available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="rounded-lg p-6 border shadow-md"
        style={{
          background: "var(--card-background)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2 className="text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <span>🎥</span>
          Videos ({allVideos.length})
        </h2>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allVideos.map((video, index) => (
            <button
              key={index}
              onClick={() => openVideoModal(video)}
              className="group relative rounded-lg overflow-hidden border video-card-hover"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--card-border)',
              }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={getYouTubeThumbnail(video.trailer.embed_url || video.trailer.url || '')}
                  alt={video.title}
                  className="w-full h-full object-cover video-thumbnail"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 video-overlay">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center video-play-button"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Play size={28} className="text-white ml-1" fill="white" />
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 right-2">
                  <span 
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                    }}
                  >
                    {video.category}
                  </span>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-3">
                <h3 
                  className="text-sm font-semibold line-clamp-2 text-left"
                  style={{ color: 'var(--foreground)' }}
                >
                  {video.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {isModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeVideoModal}
          style={{ 
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div 
            className="relative w-full rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1024px',
              background: 'var(--card-background)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
              }}
            >
              <X size={24} />
            </button>

            {/* Video Player */}
            <div className="relative aspect-video">
              <iframe
                src={getEmbedUrl(selectedVideo.trailer.embed_url || selectedVideo.trailer.url || '')}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Title */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <h3 
                className="text-lg font-bold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                {selectedVideo.title}
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--rating-text)' }}
              >
                {animeTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        /* Smooth hover animations for video cards */
        .video-card-hover {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .video-card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        /* Smooth image zoom */
        .video-thumbnail {
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(1);
        }
        
        .group:hover .video-thumbnail {
          transform: scale(1.08);
        }

        /* Smooth overlay fade */
        .video-overlay {
          opacity: 0;
          transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .group:hover .video-overlay {
          opacity: 1;
        }

        /* Smooth play button scale */
        .video-play-button {
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: scale(0.9);
        }
        
        .group:hover .video-play-button {
          transform: scale(1.1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}