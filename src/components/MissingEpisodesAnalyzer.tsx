import { useState } from 'react';
import { Search, Copy, CheckCircle, AlertTriangle, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { JikanService } from '../services/jikan';
import { Episode } from '../types/anime';

interface MissingEpisode {
  animeId: number;
  animeTitle: string;
  lastEpisodeNumber: number;
  suggestedEpisodeNumber: number;
  lastScore: number;
  suggestedScore: number;
}

export function MissingEpisodesAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [missing, setMissing] = useState<MissingEpisode[]>([]);
  const [copied, setCopied] = useState(false);

  const analyzeEpisodes = async () => {
    setIsAnalyzing(true);
    setMissing([]);

    try {
      console.log('🔍 Analisando episódios faltantes...');

      // Carregar Week 2
      const week2Data = await JikanService.getWeekData(2);
      
      // Carregar Week 3
      const week3Data = await JikanService.getWeekData(3);

      // Criar mapas
      const week2Map = new Map<number, Episode>();
      week2Data.episodes.forEach(ep => week2Map.set(ep.animeId, ep));

      const week3Map = new Map<number, Episode>();
      week3Data.episodes.forEach(ep => week3Map.set(ep.animeId, ep));

      // Encontrar diferenças
      const missingEpisodes: MissingEpisode[] = [];

      week2Map.forEach((week2Episode, animeId) => {
        if (!week3Map.has(animeId)) {
          const scoreVariation = (Math.random() - 0.5) * 0.1;
          const suggestedScore = Math.max(0, Math.min(10, week2Episode.score + scoreVariation));

          missingEpisodes.push({
            animeId,
            animeTitle: week2Episode.animeTitle,
            lastEpisodeNumber: week2Episode.episodeNumber,
            suggestedEpisodeNumber: week2Episode.episodeNumber + 1,
            lastScore: week2Episode.score,
            suggestedScore: parseFloat(suggestedScore.toFixed(2)),
          });
        }
      });

      // Ordenar por score
      missingEpisodes.sort((a, b) => b.lastScore - a.lastScore);

      setMissing(missingEpisodes);
      console.log(`✅ Encontrados ${missingEpisodes.length} episódios faltantes`);
    } catch (error) {
      console.error('❌ Erro ao analisar episódios:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCode = () => {
    const code = missing.map(item => {
      return `  {
    animeId: ${item.animeId},
    episodeNumber: ${item.suggestedEpisodeNumber},
    episodeTitle: "Episode ${item.suggestedEpisodeNumber}", // ⚠️ SUBSTITUIR pelo título real
    weekNumber: 3,
    score: ${item.suggestedScore}
  }`;
    }).join(',\n');

    return code;
  };

  const copyCode = async () => {
    const code = generateCode();
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2">
          <Search className="w-6 h-6" />
          Analisador de Episódios Faltantes
        </h2>
        <p className="text-muted-foreground">
          Compara Week 2 com Week 3 para identificar episódios que deveriam estar presentes mas não estão na API.
        </p>
      </div>

      {/* Action Button */}
      <div>
        <Button
          onClick={analyzeEpisodes}
          disabled={isAnalyzing}
          size="lg"
          className="gap-2"
        >
          <Search className="w-5 h-5" />
          {isAnalyzing ? 'Analisando...' : 'Analisar Week 2 vs Week 3'}
        </Button>
      </div>

      {/* Results */}
      {missing.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p>
                Encontrados <strong>{missing.length} episódios</strong> que estavam na Week 2 mas não estão na Week 3
              </p>
            </div>
          </div>

          {/* Episodes List */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2">
              Episódios Sugeridos
            </h3>
            
            <div className="grid gap-2">
              {missing.map((item, idx) => (
                <div
                  key={item.animeId}
                  className="p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p>
                        <span className="text-muted-foreground">{idx + 1}.</span>{' '}
                        <strong>{item.animeTitle}</strong>
                      </p>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>Anime ID: {item.animeId}</p>
                        <p>
                          Último episódio: <strong>EP{item.lastEpisodeNumber}</strong> (Score: {item.lastScore})
                        </p>
                        <p>
                          Sugestão: <strong className="text-primary">EP{item.suggestedEpisodeNumber}</strong>{' '}
                          (Score estimado: {item.suggestedScore})
                        </p>
                      </div>
                    </div>

                    <a
                      href={`https://myanimelist.net/anime/${item.animeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Ver no MAL →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Código para manual-episodes.ts
              </h3>
              
              <Button
                onClick={copyCode}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Código
                  </>
                )}
              </Button>
            </div>

            <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
              <code>{generateCode()}</code>
            </pre>

            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ <strong>IMPORTANTE:</strong> Você precisa substituir os títulos "Episode X" pelos títulos reais dos episódios.
                Visite os links "Ver no MAL" acima para encontrar os títulos corretos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isAnalyzing && missing.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Clique no botão acima para começar a análise</p>
        </div>
      )}
    </div>
  );
}
