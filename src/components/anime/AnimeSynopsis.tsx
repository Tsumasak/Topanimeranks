'use client';

interface AnimeSynopsisProps {
  synopsis?: string;
}

export function AnimeSynopsis({ synopsis }: AnimeSynopsisProps) {
  if (!synopsis) return null;

  return (
    <div 
      className="rounded-lg p-6 mb-8 border shadow-md"
      style={{
        background: "var(--card-background)",
        borderColor: "var(--card-border)",
      }}
    >
      <h2 className="text-2xl mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
        <span>📖</span>
        Synopsis
      </h2>
      <p className="leading-relaxed" style={{ color: 'var(--rating-text)' }}>
        {synopsis}
      </p>
    </div>
  );
}