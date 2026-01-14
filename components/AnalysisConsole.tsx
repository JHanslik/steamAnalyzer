'use client';

interface LogEntry {
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AnalysisConsoleProps {
  logs: LogEntry[];
}

export default function AnalysisConsole({ logs }: AnalysisConsoleProps) {
  if (logs.length === 0) return null;

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return '→';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-4 text-sm font-medium text-gray-300">Console d&apos;analyse</span>
          </div>
          <div className="text-xs text-gray-400">
            {logs.length} ligne{logs.length > 1 ? 's' : ''}
          </div>
        </div>
        <div className="p-4 font-mono text-sm max-h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 py-1 ${getLogColor(log.type)}`}
            >
              <span className="text-gray-500 text-xs">
                {log.timestamp.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </span>
              <span className="mr-2">{getLogIcon(log.type)}</span>
              <span className="flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
