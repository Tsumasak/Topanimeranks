import { SetupSupabase } from '../components/SetupSupabase';
import { useNavigate } from 'react-router-dom';
import { useSupabaseStatus } from '../hooks/useSupabaseStatus';
import { CheckCircle2, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect } from 'react';

export default function SetupPage() {
  const navigate = useNavigate();
  const { needsSetup, loading } = useSupabaseStatus();

  // If setup is complete, show success message
  if (!loading && !needsSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center space-y-6">
            <div className="bg-green-500 w-20 h-20 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-green-600 dark:text-green-400">
              Setup Complete! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your database is ready and the app is fully functional.
              You can now use all features!
            </p>

            <div className="pt-6">
              <Button
                onClick={() => navigate('/home')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Home Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8 space-y-4">
          <div className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold">
            🚨 REQUIRED: First Time Setup
          </div>
          
          <h1 className="text-5xl font-bold">
            Database Setup
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Before you can use the app, you need to create the database tables.
            <br />
            <strong className="text-gray-800 dark:text-gray-200">This is a one-time process that takes ~2 minutes.</strong>
          </p>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Step-by-step guide
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Copy-paste ready
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Super easy
            </div>
          </div>
        </div>

        <SetupSupabase />

        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
