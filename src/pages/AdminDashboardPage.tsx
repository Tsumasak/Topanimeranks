import { Link, useNavigate } from "react-router-dom";
import { CopyPlus, Download, ExternalLink, Image, RefreshCw, LogOut } from "lucide-react";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin-login");
  };

  const menuItems = [
    {
      title: "Export Ranking Data",
      description: "Download CSVs for Top Animes, Genres, Most Anticipated, etc.",
      icon: <Download className="w-8 h-8" />,
      link: "/admin-export-ranks",
      color: "var(--rating-yellow)"
    },
    {
      title: "Export Anime Details",
      description: "Export full stats and episodes info for a specific anime.",
      icon: <CopyPlus className="w-8 h-8" />,
      link: "/admin-export-anime",
      color: "#22c55e"
    },
    {
      title: "Hero Banner Config",
      description: "Upload and configure the hero banner displayed on the homepage.",
      icon: <Image className="w-8 h-8" />,
      link: "/admin-hero-banners",
      color: "#3b82f6"
    },
    {
      title: "App Sync & Metadata",
      description: "Synchronize season data, fetch missing episodes, update metadata.",
      icon: <RefreshCw className="w-8 h-8" />,
      link: "/admin-sync",
      color: "#a855f7"
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-screen-xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black mb-2" style={{ color: "var(--foreground)" }}>
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Manage all site content, assets, and data exports from one place.
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: "var(--card-border)", color: "var(--foreground)" }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => (
            <Link 
              key={idx} 
              to={item.link}
              className="flex flex-col group p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: "var(--card-background)", borderColor: "var(--card-border)" }}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                {item.icon}
              </div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                {item.title}
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-sm text-gray-400">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
