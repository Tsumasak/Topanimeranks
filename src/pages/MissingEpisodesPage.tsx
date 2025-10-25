import { Header } from '../components/Header';
import { MissingEpisodesAnalyzer } from '../components/MissingEpisodesAnalyzer';

export function MissingEpisodesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="missing-episodes" />
      
      <main className="container mx-auto px-4 py-8">
        <MissingEpisodesAnalyzer />
      </main>
    </div>
  );
}
