import { Users, Star, TrendingUp, PlayCircle } from "lucide-react";

export function Stats() {
  const stats = [
    {
      icon: PlayCircle,
      label: "Total Anime",
      value: "5,000+",
      bgColor: "#7c3aed", // purple
    },
    {
      icon: Star,
      label: "Avg Rating",
      value: "8.5/10",
      bgColor: "var(--rating-yellow)",
    },
    {
      icon: Users,
      label: "Active Users",
      value: "1M+",
      bgColor: "#3b82f6", // blue
    },
    {
      icon: TrendingUp,
      label: "Trending Now",
      value: "250+",
      bgColor: "#ec4899", // pink
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="theme-card rounded-xl p-6 border border-transparent"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
              style={{ background: stat.bgColor }}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl mb-1">{stat.value}</div>
            <div className="text-sm opacity-70">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
