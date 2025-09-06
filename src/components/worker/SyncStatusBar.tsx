import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Card, Button, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncOfflineData } from '../../services/api';

interface SyncStatusBarProps {
  isOnline: boolean;
  syncPending: boolean;
  pendingCount?: number;
  onSyncRequest?: () => void;
}

export default function SyncStatusBar({ 
  isOnline, 
  syncPending, 
  pendingCount = 0,
  onSyncRequest 
}: SyncStatusBarProps) {
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Load last sync time from AsyncStorage
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const stored = await AsyncStorage.getItem('lastSyncTime');
        if (stored) {
          setLastSynced(stored);
        }
      } catch (error) {
        console.error('Error loading last sync time:', error);
      }
    };

    loadLastSyncTime();
  }, []);

  // Save last sync time to AsyncStorage
  const saveLastSyncTime = async (time: string) => {
    try {
      await AsyncStorage.setItem('lastSyncTime', time);
      setLastSynced(time);
    } catch (error) {
      console.error('Error saving last sync time:', error);
    }
  };

  // Initialize sync progress when sync starts
  useEffect(() => {
    if (syncing) {
      setSyncProgress(0);
    }
  }, [syncing]);

  // Simulate sync progress updates
  useEffect(() => {
    if (syncing) {
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            setSyncing(false);
            saveLastSyncTime(new Date().toLocaleTimeString());
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [syncing]);

  // Trigger sync manually
  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert(
        'Cannot sync',
        'You are currently offline. Please try again when you have a connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (pendingCount === 0) {
      Alert.alert(
        'No data to sync',
        'All your data is already synchronized.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSyncing(true);
    
    try {
      // Call the real sync function
      await syncOfflineData();
      
      // Update last sync time
      const now = new Date().toISOString();
      setLastSynced(now);
      await AsyncStorage.setItem('lastSyncTime', now);
      
      Alert.alert(
        'Sync completed',
        `Successfully synced ${pendingCount} item${pendingCount !== 1 ? 's' : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert(
        'Sync failed',
        'Failed to sync data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSyncing(false);
    }
  };

  // If all data is synchronized and online
  if (!syncPending && !syncing && isOnline) {
    return (
      <Card style={[styles.container, styles.syncedContainer]}>
        <Card.Content style={styles.content}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Icon name="check-circle" size={16} color="#16a34a" />
              <Text style={[styles.statusText, styles.syncedText]}>
                All data synchronized
              </Text>
            </View>
            {lastSynced && (
              <Text style={styles.lastSyncText}>
                Last synced: {lastSynced}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[
      styles.container,
      isOnline ? styles.onlineContainer : styles.offlineContainer
    ]}>
      <Card.Content style={styles.content}>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            {isOnline ? (
              <>
                {syncing ? (
                  <Icon name="refresh" size={16} color="#2563eb" />
                ) : (
                  <Icon name="wifi" size={16} color="#2563eb" />
                )}
                <Text style={[
                  styles.statusText,
                  isOnline ? styles.onlineText : styles.offlineText
                ]}>
                  {syncing 
                    ? 'Syncing data...' 
                    : pendingCount > 0 
                      ? `${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending sync` 
                      : 'Ready to sync'
                  }
                </Text>
              </>
            ) : (
              <>
                <Icon name="wifi-off" size={16} color="#d97706" />
                <Text style={[styles.statusText, styles.offlineText]}>
                  {pendingCount > 0 
                    ? `Offline: ${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending` 
                    : "You're offline"
                  }
                </Text>
              </>
            )}
          </View>

          {isOnline && !syncing && pendingCount > 0 && (
            <Button
              mode="outlined"
              onPress={handleSync}
              style={styles.syncButton}
              compact
            >
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </Button>
          )}
        </View>

        {syncing && (
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={syncProgress / 100} 
              color="#2563eb" 
              style={styles.progressBar}
            />
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {syncProgress}% complete
              </Text>
              <Text style={styles.progressText}>
                {Math.min(Math.ceil(pendingCount * (syncProgress / 100)), pendingCount)} of {pendingCount} items
              </Text>
            </View>
          </View>
        )}

        {!isOnline && pendingCount > 0 && (
          <Text style={styles.offlineMessage}>
            {pendingCount} item{pendingCount !== 1 ? 's' : ''} will sync automatically when you're back online.
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  syncedContainer: {
    backgroundColor: '#f0fdf4',
  },
  onlineContainer: {
    backgroundColor: '#eff6ff',
  },
  offlineContainer: {
    backgroundColor: '#fffbeb',
  },
  content: {
    paddingVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  syncedText: {
    color: '#16a34a',
  },
  onlineText: {
    color: '#2563eb',
  },
  offlineText: {
    color: '#d97706',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#6b7280',
  },
  syncButton: {
    borderColor: '#2563eb',
    backgroundColor: 'white',
  },
  syncButtonText: {
    fontSize: 12,
    color: '#2563eb',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  offlineMessage: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 8,
    lineHeight: 16,
  },
});
