import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle2, Loader2, Database, Play, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CopySchemaButton } from './CopySchemaButton';
import { SQLTextArea } from './SQLTextArea';

export function SetupSupabase() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error' | 'manual'>('idle');
  const [message, setMessage] = useState<string>('');
  const [details, setDetails] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const runSetup = async () => {
    setStatus('running');
    setMessage('');
    setDetails(null);
    setLogs([]);

    try {
      addLog('🚀 Starting Supabase setup...');
      addLog(`📡 Connecting to project: ${projectId}`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/setup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        addLog('✅ Setup completed successfully!');
        addLog(`📊 Tables created: ${data.tables_created?.join(', ')}`);
        addLog(`📈 Views created: ${data.views_created?.join(', ')}`);
        
        setStatus('success');
        setMessage(data.message);
        setDetails(data);
      } else if (data.instructions) {
        // Need manual setup
        addLog('⚠️ Automatic setup failed - manual setup required');
        setStatus('manual');
        setMessage(data.error);
        setDetails(data);
      } else {
        throw new Error(data.error || 'Setup failed');
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to execute setup');
      console.error('Setup error:', error);
    }
  };

  const checkStatus = async () => {
    try {
      addLog('🔍 Checking table status...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/sync-status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        addLog(`✅ Found ${data.logs?.length || 0} sync records`);
        addLog('✅ Tables are working correctly!');
        setStatus('success');
        setMessage('Database is ready!');
        setDetails(data);
      } else {
        addLog('⚠️ Tables have not been created yet');
        setStatus('manual');
        setMessage(data.error || 'Tables need to be created');
        setDetails(data);
      }
    } catch (error) {
      addLog(`❌ Error checking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          <CardTitle>Supabase Database Setup</CardTitle>
        </div>
        <CardDescription>
          First, try the automatic setup. If it doesn't work, follow the manual instructions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Alert */}
        {status === 'success' && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'manual' && details?.instructions && (
          <div className="space-y-4">
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <div className="space-y-3">
                  <p className="font-semibold text-base">⚠️ Manual Setup Required</p>
                  <p className="text-sm">
                    The database tables need to be created manually. This is normal!
                    Follow the 4 simple steps below:
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Step-by-step guide */}
            <div className="bg-white dark:bg-gray-900 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6 space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-lg font-bold">Copy the SQL</h3>
              </div>
              <div className="ml-10 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose one of these methods to copy the SQL:
                </p>
                
                <CopySchemaButton 
                  onCopy={(success) => {
                    if (success) {
                      addLog('✅ Complete SQL copied! Now paste it in Supabase SQL Editor.');
                    } else {
                      addLog('⚠️ Auto-copy failed. Use the text box below to copy manually.');
                    }
                  }}
                />
                
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    <strong>📝 Alternative:</strong> If the buttons above don't work, use the text box below:
                  </p>
                  <SQLTextArea />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-bold">Open Supabase SQL Editor</h3>
              </div>
              <div className="ml-10 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the button below to open the SQL Editor in a new tab:
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/sql`, '_blank')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Open Supabase SQL Editor
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-bold">Paste and Run</h3>
              </div>
              <div className="ml-10 space-y-3">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>In the SQL Editor, click <strong>"+ New query"</strong></li>
                  <li>Paste the SQL you copied (Ctrl+V / Cmd+V)</li>
                  <li>Click the <strong>"RUN"</strong> button (bottom right)</li>
                  <li>Wait for the green success message: <code className="bg-gray-100 dark:bg-gray-800 px-1">✅ Success. No rows returned</code></li>
                </ol>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-lg font-bold">Verify Setup</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-10">
                After running the SQL in Supabase, come back here and click{' '}
                <strong>"Check Status"</strong> to confirm everything was created correctly.
              </p>

              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ <strong>Success looks like:</strong> You'll see green success messages in Supabase 
                  and several NOTICE messages confirming tables were created.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm">Connection Info</h3>
          <div className="text-xs font-mono space-y-1">
            <div>
              <span className="text-gray-500">Project ID:</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">{projectId}</span>
            </div>
            <div>
              <span className="text-gray-500">URL:</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">
                https://{projectId}.supabase.co
              </span>
            </div>
            <div>
              <span className="text-gray-500">Anon Key:</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                {publicAnonKey.substring(0, 20)}...
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={runSetup}
            disabled={status === 'running'}
            className="flex-1"
          >
            {status === 'running' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Setup...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Try Automatic Setup
              </>
            )}
          </Button>

          <Button
            onClick={checkStatus}
            variant="outline"
            disabled={status === 'running'}
          >
            <Database className="w-4 h-4 mr-2" />
            Check Status
          </Button>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        )}

        {/* Details */}
        {details && status === 'success' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Next Steps:</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {details.next_steps?.map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sync Logs */}
        {details?.logs && details.logs.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Sync History:</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {details.logs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{log.sync_type}</span>
                    <span
                      className={
                        log.status === 'success'
                          ? 'text-green-600'
                          : log.status === 'error'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </div>
                  {log.items_synced > 0 && (
                    <div className="text-gray-600 mt-1">
                      {log.items_synced} items synced
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Instructions Link */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Need help? Check{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
            /SUPABASE_MANUAL_SETUP.md
          </code>{' '}
          or{' '}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
            /✅_ERRO_CORRIGIDO.md
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
