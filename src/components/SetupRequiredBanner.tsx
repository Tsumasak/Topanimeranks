import { AlertCircle, ArrowRight, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function SetupRequiredBanner() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 animate-in slide-in-from-top">
      <div className="max-w-7xl mx-auto">
        <Alert className="border-none bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-xl">
          <div className="flex items-start gap-4">
            <div className="bg-yellow-500 rounded-full p-2 flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <AlertTitle className="text-lg font-bold mb-2">
                ⚙️ Database Setup Required
              </AlertTitle>
              <AlertDescription className="text-sm space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>First time here?</strong> You need to create the database tables to use the app.
                  This is a one-time setup that takes ~2 minutes.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Database className="w-4 h-4" />
                  <span>Don't worry! We'll guide you step-by-step 😊</span>
                </div>
              </AlertDescription>
            </div>

            <Button
              onClick={() => navigate('/setup')}
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-lg flex-shrink-0"
            >
              Start Setup
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
