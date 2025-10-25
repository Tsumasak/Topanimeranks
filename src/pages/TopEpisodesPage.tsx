import { useEffect } from "react";
import WeekControl from "../components/WeekControl";

export default function TopEpisodesPage() {
  useEffect(() => {
    console.log("[TopEpisodesPage] Component mounted");
  }, []);

  return <WeekControl />;
}
