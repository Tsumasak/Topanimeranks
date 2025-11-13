"use client";

interface AnimeStatsProps {
  anime: any;
}

export function AnimeStats({ anime }: AnimeStatsProps) {
  const stats = [
    {
      label: "Overall Rank",
      value: anime.rank ? `#${anime.rank}` : "N/A",
    },
    {
      label: "Rating",
      value:
        anime.score || anime.anime_score
          ? (anime.score || anime.anime_score).toFixed(2)
          : "N/A",
    },
    {
      label: "Popularity",
      value: anime.popularity ? `#${anime.popularity}` : "N/A",
    },
    {
      label: "Members on MAL",
      value: anime.members
        ? anime.members.toLocaleString()
        : "N/A",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-lg p-6 border shadow-md"
          style={{
            background: "var(--card-background)",
            borderColor: "var(--card-border)",
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <p
              className="text-sm mb-1"
              style={{ color: "var(--rating-text)" }}
            >
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: "var(--rating-yellow)" }}
            >
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}