import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
}

interface OfflineInspection {
  id: string;
  data: any;
  status: 'draft' | 'pending_sync' | 'synced';
  lastModified: number;
  photos?: File[];
}

interface OfflineState {
  isOnline: boolean;
  pendingRequests: number;
  lastSync: Date | null;
  syncInProgress: boolean;
}

export function useOfflineSync() {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    pendingRequests: 0,
    lastSync: null,
    syncInProgress: false
  });
  const { toast } = useToast();

  // Initialize IndexedDB
  const openDB = useCallback(async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('railway-inspection-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('requests')) {
          const requestStore = db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
          requestStore.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('inspections')) {
          const inspectionStore = db.createObjectStore('inspections', { keyPath: 'id' });
          inspectionStore.createIndex('status', 'status');
        }
      };
    });
  }, []);

  // Save inspection offline
  const saveInspectionOffline = useCallback(async (inspection: Omit<OfflineInspection, 'lastModified'>) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['inspections'], 'readwrite');
      const store = transaction.objectStore('inspections');
      
      const offlineInspection: OfflineInspection = {
        ...inspection,
        lastModified: Date.now()
      };
      
      await store.put(offlineInspection);
      
      toast({
        title: "Saved Offline",
        description: "Inspection saved locally. Will sync when online.",
      });
      
      await updatePendingCount();
    } catch (error) {
      console.error('Failed to save inspection offline:', error);
      toast({
        title: "Save Failed",
        description: "Could not save inspection offline.",
        variant: "destructive"
      });
    }
  }, [openDB, toast]);

  // Get offline inspections
  const getOfflineInspections = useCallback(async (): Promise<OfflineInspection[]> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['inspections'], 'readonly');
      const store = transaction.objectStore('inspections');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as OfflineInspection[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get offline inspections:', error);
      return [];
    }
  }, [openDB]);

  // Delete offline inspection
  const deleteOfflineInspection = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['inspections'], 'readwrite');
      const store = transaction.objectStore('inspections');
      await store.delete(id);
      await updatePendingCount();
    } catch (error) {
      console.error('Failed to delete offline inspection:', error);
    }
  }, [openDB]);

  // Update pending requests count
  const updatePendingCount = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['requests', 'inspections'], 'readonly');
      
      const requestsCount = await new Promise<number>((resolve, reject) => {
        const request = transaction.objectStore('requests').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const inspectionsCount = await new Promise<number>((resolve, reject) => {
        const request = transaction.objectStore('inspections').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      setOfflineState(prev => ({
        ...prev,
        pendingRequests: requestsCount + inspectionsCount
      }));
    } catch (error) {
      console.error('Failed to update pending count:', error);
    }
  }, [openDB]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.syncInProgress) {
      return;
    }

    setOfflineState(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Register background sync if supported
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // Type assertion for background sync API
        const syncRegistration = registration as any;
        if (syncRegistration.sync) {
          await syncRegistration.sync.register('background-sync');
        } else {
          // Fallback: manual sync
          await performManualSync();
        }
      } else {
        // Fallback: manual sync
        await performManualSync();
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync offline data. Will retry automatically.",
        variant: "destructive"
      });
    } finally {
      setOfflineState(prev => ({ 
        ...prev, 
        syncInProgress: false,
        lastSync: new Date()
      }));
    }
  }, [offlineState.isOnline, offlineState.syncInProgress, toast]);

  // Manual sync implementation
  const performManualSync = useCallback(async () => {
    const db = await openDB();
    
    // Sync offline inspections
    const inspections = await getOfflineInspections();
    const pendingSyncInspections = inspections.filter(i => i.status === 'pending_sync');
    
    for (const inspection of pendingSyncInspections) {
      try {
        // Create FormData for file uploads
        const formData = new FormData();
        formData.append('data', JSON.stringify(inspection.data));
        
        if (inspection.photos) {
          inspection.photos.forEach((photo, index) => {
            formData.append(`photo_${index}`, photo);
          });
        }
        
        const response = await fetch('/api/inspections', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          await deleteOfflineInspection(inspection.id);
          console.log('Synced inspection:', inspection.id);
        }
      } catch (error) {
        console.error('Failed to sync inspection:', inspection.id, error);
      }
    }
    
    await updatePendingCount();
  }, [openDB, getOfflineInspections, deleteOfflineInspection]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing data...",
      });
      triggerSync();
    };

    const handleOffline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "You're Offline",
        description: "Inspections will be saved locally and synced when online.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, triggerSync]);

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          setOfflineState(prev => ({
            ...prev,
            lastSync: new Date(),
            syncInProgress: false
          }));
          
          toast({
            title: "Sync Complete",
            description: `Synced ${event.data.syncedCount} items successfully.`,
          });
          
          updatePendingCount();
        }
      });
    }
  }, [toast, updatePendingCount]);

  // Initialize pending count on mount
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    offlineState,
    saveInspectionOffline,
    getOfflineInspections,
    deleteOfflineInspection,
    triggerSync,
    updatePendingCount
  };
}