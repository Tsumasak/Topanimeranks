import { useState, useEffect } from 'react';
import { X, Zap, ArrowRight } from 'lucide-react';
import { SupabaseService } from '../services/supabase';

/**
 * Banner that shows when Supabase is not setup yet
 * Encourages user to run the setup for better performance
 */
export const SetupBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    const isConfigured = SupabaseService.isConfigured();
    
    // Check if user dismissed the banner
    const dismissed = localStorage.getItem('setup-banner-dismissed') === 'true';
    
    // Show banner if not configured and not dismissed
    setIsVisible(!isConfigured && !dismissed);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('setup-banner-dismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div
      className="relative mb-6 rounded-lg p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
      }}
    >
      {/* Animated Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
        style={{ color: 'white' }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 text-white">
            <h3 className="text-xl mb-2">
              ⚡ Turbine seu site com Supabase!
            </h3>
            <p className="text-white/90 text-sm mb-4 max-w-2xl">
              Configure o cache Supabase em 1 clique e transforme o carregamento de <strong>5-15 segundos</strong> em <strong className="text-yellow-300">&lt; 1 segundo</strong>! 
              Seus dados serão sincronizados automaticamente a cada 10 minutos.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                <span className="text-sm text-white/90">
                  <strong className="text-yellow-300">100x</strong> mais rápido
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-sm text-white/90">
                  Setup em <strong className="text-green-300">30 segundos</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                <span className="text-sm text-white/90">
                  <strong className="text-blue-300">Grátis</strong> e automático
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-all hover:scale-105 hover:shadow-xl"
              style={{
                background: 'white',
                color: '#667eea',
              }}
            >
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Configurar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
