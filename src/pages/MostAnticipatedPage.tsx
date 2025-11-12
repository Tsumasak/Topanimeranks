import { useEffect } from "react";
import SeasonControl from "../components/SeasonControl";

export default function MostAnticipatedPage() {
  useEffect(() => {
    console.log("[MostAnticipatedPage] Component mounted");
  }, []);

  return <SeasonControl />;
}