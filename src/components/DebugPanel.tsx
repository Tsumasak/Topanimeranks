import { useState } from 'react';
import { Episode } from '../types/anime';

interface DebugPanelProps {
  episodes?: Episode[];
}

export default function DebugPanel({ episodes = [] }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl p-6 max-w-2xl max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Episodes Count: {episodes.length}</h4>
          {episodes.slice(0, 5).map((episode, index) => (
            <div key={episode.id} className="text-sm border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
              <div className="font-medium">{index + 1}. {episode.animeTitle}</div>
              <div className="text-gray-600 dark:text-gray-400">
                Episode {episode.episodeNumber} - Score: {episode.episodeScore}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
