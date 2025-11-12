import { useState } from 'react';
import { Search, Copy, CheckCircle, AlertTriangle, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { JikanService } from '../services/jikan';
import { Episode } from '../types/anime';
import { WEEKS_DATA } from '../config/weeks';

interface MissingEpisode {
  animeId: number;
  animeTitle: string;
  lastEpisodeNumber: number;
  suggestedEpisodeNumber: number;
  lastScore: number;
  suggestedScore: number;
  episodeTitle: string;
  newScore: number;
}

export function MissingEpisodesAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [weekBase, setWeekBase] = useState<string>('2');
  const [weekComparison, setWeekComparison] = useState<string>('3');
  const [missing, setMissing] = useState<MissingEpisode[]>([]);
  const [copied, setCopied] = useState(false);

  const updateEpisodeTitle = (animeId: number, title: string) => {
    setMissing(prev => prev.map(ep => 
      ep.animeId === animeId ? { ...ep, episodeTitle: title } : ep
    ));
  };

  const updateEpisodeScore = (animeId: number, score: number) => {
    setMissing(prev => prev.map(ep => 
      ep.animeId === animeId ? { ...ep, newScore: score } : ep
    ));
  };

  const analyzeEpisodes = async () => {
    setIsAnalyzing(true);
    setMissing([]);

    try {
      const weekBaseNum = parseInt(weekBase);
      const weekCompNum = parseInt(weekComparison);

      console.log(`🔍 Analisando episódios: Week ${weekBaseNum} vs Week ${weekCompNum}...`);

      // Carregar Week Base
      const weekBaseData = await JikanService.getWeekData(weekBaseNum);
      
      // Carregar Week Comparação
      const weekCompData = await JikanService.getWeekData(weekCompNum);

      // Criar mapas
      const weekBaseMap = new Map<number, Episode>();
      weekBaseData.episodes.forEach(ep => weekBaseMap.set(ep.animeId, ep));

      const weekCompMap = new Map<number, Episode>();
      weekCompData.episodes.forEach(ep => weekCompMap.set(ep.animeId, ep));

      // Encontrar diferenças
      const missingEpisodes: MissingEpisode[] = [];

      weekBaseMap.forEach((baseEpisode, animeId) => {
        if (!weekCompMap.has(animeId)) {
          const scoreVariation = (Math.random() - 0.5) * 0.1;
          const suggestedScore = Math.max(0, Math.min(10, baseEpisode.episodeScore + scoreVariation));

          missingEpisodes.push({
            animeId,
            animeTitle: baseEpisode.animeTitle,
            lastEpisodeNumber: baseEpisode.episodeNumber,
            suggestedEpisodeNumber: baseEpisode.episodeNumber + 1,
            lastScore: baseEpisode.episodeScore,
            suggestedScore: parseFloat(suggestedScore.toFixed(2)),
            episodeTitle: `Episode ${baseEpisode.episodeNumber + 1}`,
            newScore: parseFloat(suggestedScore.toFixed(2)),
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
    episodeTitle: "${item.episodeTitle}",
    weekNumber: ${weekComparison},
    score: ${item.newScore}
  }`;
    }).join(',\n');

    return code;
  };

  const copyCode = async () => {
    const code = generateCode();
    
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback: Use textarea method
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      textArea.remove();
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('Fallback copy failed');
      }
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
          Compara duas semanas para identificar episódios que deveriam estar presentes mas não estão na segunda semana.
        </p>
      </div>

      {/* Week Selection */}
      <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
        <h3 className="">Selecione as semanas para análise</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="week-base">Week Base</Label>
            <Select value={weekBase} onValueChange={setWeekBase}>
              <SelectTrigger id="week-base">
                <SelectValue placeholder="Selecione a week base" />
              </SelectTrigger>
              <SelectContent>
                {WEEKS_DATA.map((week) => {
                  const weekNum = week.label.split(' ')[1];
                  return (
                    <SelectItem key={week.id} value={weekNum}>
                      {week.label} ({week.period.replace('Aired - ', '').replace('Airing - ', '')})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="week-comparison">Week Comparação</Label>
            <Select value={weekComparison} onValueChange={setWeekComparison}>
              <SelectTrigger id="week-comparison">
                <SelectValue placeholder="Selecione a week de comparação" />
              </SelectTrigger>
              <SelectContent>
                {WEEKS_DATA.map((week) => {
                  const weekNum = week.label.split(' ')[1];
                  return (
                    <SelectItem key={week.id} value={weekNum}>
                      {week.label} ({week.period.replace('Aired - ', '').replace('Airing - ', '')})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={analyzeEpisodes}
          disabled={isAnalyzing}
          size="lg"
          className="gap-2 w-full"
        >
          <Search className="w-5 h-5" />
          {isAnalyzing ? 'Analisando...' : `Analisar Week ${weekBase} vs Week ${weekComparison}`}
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
                Encontrados <strong>{missing.length} episódios</strong> que estavam na Week {weekBase} mas não estão na Week {weekComparison}
              </p>
            </div>
          </div>

          {/* Episodes List */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2">
              Episódios Sugeridos
            </h3>
            
            <div className="grid gap-4">
              {missing.map((item, idx) => (
                <div
                  key={item.animeId}
                  className="p-4 bg-card border border-border rounded-lg space-y-3"
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
                          Sugestão: <strong className="text-primary">EP{item.suggestedEpisodeNumber}</strong>
                        </p>
                      </div>
                    </div>

                    <a
                      href={`https://myanimelist.net/anime/${item.animeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline whitespace-nowrap"
                    >
                      Ver no MAL →
                    </a>
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${item.animeId}`} className="text-sm">
                        Nome do novo episódio
                      </Label>
                      <Input
                        id={`title-${item.animeId}`}
                        value={item.episodeTitle}
                        onChange={(e) => updateEpisodeTitle(item.animeId, e.target.value)}
                        placeholder="Ex: Episode 3"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`score-${item.animeId}`} className="text-sm">
                        Score do novo episódio
                      </Label>
                      <Input
                        id={`score-${item.animeId}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={item.newScore}
                        onChange={(e) => updateEpisodeScore(item.animeId, parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 4.50"
                        className="h-9"
                      />
                    </div>
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

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ✨ <strong>PRONTO PARA USAR:</strong> O código acima já contém os títulos e scores que você preencheu.
                Basta copiar e colar no arquivo <code className="px-1.5 py-0.5 bg-blue-500/10 rounded">manual-episodes.ts</code>
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