import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { offlineState, triggerSync } = useOfflineSync();

  const getStatusColor = () => {
    if (!offlineState.isOnline) return 'bg-red-500';
    if (offlineState.syncInProgress) return 'bg-yellow-500';
    if (offlineState.pendingRequests > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!offlineState.isOnline) return 'Offline';
    if (offlineState.syncInProgress) return 'Syncing...';
    if (offlineState.pendingRequests > 0) return `${offlineState.pendingRequests} pending`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!offlineState.isOnline) return <WifiOff className="w-4 h-4" />;
    if (offlineState.syncInProgress) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (offlineState.pendingRequests > 0) return <Clock className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>

        {/* Pending items badge */}
        {offlineState.pendingRequests > 0 && (
          <Badge variant="secondary" className="text-xs">
            {offlineState.pendingRequests}
          </Badge>
        )}

        {/* Sync button */}
        {offlineState.isOnline && offlineState.pendingRequests > 0 && !offlineState.syncInProgress && (
          <Button
            size="sm"
            variant="outline"
            onClick={triggerSync}
            className="h-8 px-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Sync
          </Button>
        )}

        {/* Last sync time */}
        {offlineState.lastSync && (
          <div className="text-xs text-gray-500 border-l pl-2 ml-2">
            Last sync: {offlineState.lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Offline mode notification */}
      {!offlineState.isOnline && (
        <div className="mt-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 max-w-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Working Offline
              </p>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                Your inspections will be saved locally and synced when you're back online.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sync success notification */}
      {offlineState.isOnline && offlineState.pendingRequests === 0 && offlineState.lastSync && (
        <div className="mt-2 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 max-w-sm opacity-90">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              All data synced
            </p>
          </div>
        </div>
      )}
    </div>
  );
}