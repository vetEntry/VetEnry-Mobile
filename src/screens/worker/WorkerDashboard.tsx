import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Chip, FAB, ActivityIndicator, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { workerAPI, syncOfflineData } from '../../services/api';
import TaskDashboard from '../../components/worker/TaskDashboard';
import NotificationCenter from '../../components/worker/NotificationCenter';

interface AssignedFlock {
  id: string;
  name: string;
  breed: string;
  species: string;
  status: string;
  farmId: string;
  healthStatus: string;
  totalBirds: number;
  age: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  flockId: string;
  assignedWorker: string;
  category: string;
  isRecurring: boolean;
  nextOccurrence?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'alert' | 'reminder' | 'system';
  isRead: boolean;
  createdAt: string;
}

interface SyncStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncTime?: string;
}

const mockAssignedFlocks: AssignedFlock[] = [
  {
    id: '1',
    name: 'Broiler Batch A',
    breed: 'Broiler',
    species: 'Chicken',
    status: 'Active',
    farmId: 'farm1',
    healthStatus: 'Excellent',
    totalBirds: 500,
    age: 25,
  },
  {
    id: '2',
    name: 'Layer Flock B',
    breed: 'Improved',
    species: 'Chicken',
    status: 'Active',
    farmId: 'farm1',
    healthStatus: 'Good',
    totalBirds: 300,
    age: 45,
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Feed Broiler Batch A',
    description: 'Morning feeding for broiler batch A - 25kg feed',
    priority: 'high',
    dueDate: '2024-01-15T09:00:00Z',
    status: 'completed',
    flockId: '1',
    assignedWorker: 'worker1',
    category: 'feeding',
    isRecurring: true,
    nextOccurrence: '2024-01-16T09:00:00Z',
  },
  {
    id: '2',
    title: 'Health Check Layer Flock B',
    description: 'Daily health monitoring and temperature check',
    priority: 'medium',
    dueDate: '2024-01-15T14:00:00Z',
    status: 'pending',
    flockId: '2',
    assignedWorker: 'worker1',
    category: 'health',
    isRecurring: true,
    nextOccurrence: '2024-01-16T14:00:00Z',
  },
  {
    id: '3',
    title: 'Weight Measurement',
    description: 'Weekly weight sampling for broiler batch A',
    priority: 'low',
    dueDate: '2024-01-16T10:00:00Z',
    status: 'pending',
    flockId: '1',
    assignedWorker: 'worker1',
    category: 'measurement',
    isRecurring: false,
  },
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Task Reminder',
    message: 'Health check for Layer Flock B is due in 2 hours',
    type: 'reminder',
    isRead: false,
    createdAt: '2024-01-15T12:00:00Z',
  },
  {
    id: '2',
    title: 'System Alert',
    message: 'Temperature sensor offline in Broiler Batch A',
    type: 'alert',
    isRead: false,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '3',
    title: 'Task Completed',
    message: 'Morning feeding completed for Broiler Batch A',
    type: 'task',
    isRead: true,
    createdAt: '2024-01-15T09:15:00Z',
  },
];

export default function WorkerDashboard() {
  const navigation = useNavigation();
  const [assignedFlocks, setAssignedFlocks] = useState<AssignedFlock[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingSyncCount: 0,
    isSyncing: false,
    lastSyncTime: new Date().toISOString(),
  });

  useEffect(() => {
    loadDashboardData();
    
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setSyncStatus(prev => ({
        ...prev,
        isOnline: state.isConnected ?? false,
      }));
      
      if (state.isConnected) {
        syncOfflineData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, flocksData, tasksData] = await Promise.all([
        workerAPI.getDashboard(),
        workerAPI.getFlocks(),
        workerAPI.getTasks(),
      ]);

      setAssignedFlocks(flocksData);
      setTasks(tasksData);
      // Set other dashboard data as needed
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleSyncNow = () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    // Simulate sync
    setTimeout(() => {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        pendingSyncCount: 0,
        lastSyncTime: new Date().toISOString(),
      }));
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in_progress': return '#2563eb';
      case 'pending': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'excellent': return '#16a34a';
      case 'good': return '#2563eb';
      case 'fair': return '#d97706';
      case 'poor': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.ceil(diffHours / 24)} days ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task': return 'clipboard-check';
      case 'alert': return 'alert-circle';
      case 'reminder': return 'bell';
      case 'system': return 'cog';
      default: return 'information';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task': return '#16a34a';
      case 'alert': return '#dc2626';
      case 'reminder': return '#d97706';
      case 'system': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalFlocks = assignedFlocks.length;
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Worker Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Manage your assigned flocks and daily tasks
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Icon name="account-circle" size={32} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Sync Status Bar */}
        <Card style={styles.syncStatusCard}>
          <Card.Content style={styles.syncStatusContent}>
            <View style={styles.syncStatusInfo}>
              <Icon 
                name={syncStatus.isOnline ? "wifi" : "wifi-off"} 
                size={20} 
                color={syncStatus.isOnline ? "#16a34a" : "#dc2626"} 
              />
              <Text style={[
                styles.syncStatusText,
                { color: syncStatus.isOnline ? "#16a34a" : "#dc2626" }
              ]}>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
              {syncStatus.pendingSyncCount > 0 && (
                <Text style={styles.pendingSyncText}>
                  {syncStatus.pendingSyncCount} pending
                </Text>
              )}
            </View>
            
            {syncStatus.isSyncing && (
              <View style={styles.syncProgress}>
                <ProgressBar progress={0.5} color="#16a34a" />
                <Text style={styles.syncProgressText}>Syncing...</Text>
              </View>
            )}
            
            {!syncStatus.isOnline && syncStatus.pendingSyncCount > 0 && (
              <Button
                mode="contained"
                onPress={handleSyncNow}
                style={styles.syncButton}
                disabled={syncStatus.isSyncing}
              >
                {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="egg" size={32} color="#16a34a" />
              <Text style={styles.statNumber}>{totalFlocks}</Text>
              <Text style={styles.statLabel}>Assigned Flocks</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="clipboard-list" size={32} color="#d97706" />
              <Text style={styles.statNumber}>{pendingTasks}</Text>
              <Text style={styles.statLabel}>Pending Tasks</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="check-circle" size={32} color="#16a34a" />
              <Text style={styles.statNumber}>{completedTasks}</Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Task Dashboard */}
        <TaskDashboard 
          farmWorkerId="worker1" 
          isOnline={syncStatus.isOnline} 
        />

        {/* Quick Data Entry */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Data Entry</Title>
            <Text style={styles.sectionSubtitle}>Record daily activities for your flocks</Text>
            
            <View style={styles.quickDataEntry}>
              <TouchableOpacity
                style={styles.dataEntryButton}
                onPress={() => navigation.navigate('DataEntry' as never)}
              >
                <Icon name="database-plus" size={24} color="#16a34a" />
                <Text style={styles.dataEntryText}>Feed Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dataEntryButton}
                onPress={() => Alert.alert('Coming Soon', 'Health data entry will be available soon')}
              >
                <Icon name="heart-pulse" size={24} color="#dc2626" />
                <Text style={styles.dataEntryText}>Health Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dataEntryButton}
                onPress={() => Alert.alert('Coming Soon', 'Weight data entry will be available soon')}
              >
                <Icon name="scale" size={24} color="#2563eb" />
                <Text style={styles.dataEntryText}>Weight Data</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Flock Status Summary */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Flock Status Summary</Title>
              <TouchableOpacity onPress={() => navigation.navigate('Flocks' as never)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {assignedFlocks.map((flock) => (
              <View key={flock.id} style={styles.flockItem}>
                <View style={styles.flockInfo}>
                  <Text style={styles.flockName}>{flock.name}</Text>
                  <Text style={styles.flockBreed}>{flock.breed} • {flock.species}</Text>
                  <Text style={styles.flockDetails}>
                    {flock.totalBirds} birds • {flock.age} days old
                  </Text>
                </View>

                <View style={styles.flockStatus}>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getHealthColor(flock.healthStatus) }}
                    style={[styles.healthChip, { borderColor: getHealthColor(flock.healthStatus) }]}
                  >
                    {flock.healthStatus}
                  </Chip>
                  
                  <Chip mode="outlined" style={styles.statusChip}>
                    {flock.status}
                  </Chip>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Notification Center */}
        <NotificationCenter 
          userId="worker1" 
          isOnline={syncStatus.isOnline} 
        />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('DataEntry' as never)}
        color="white"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  syncStatusCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  syncStatusContent: {
    paddingVertical: 12,
  },
  syncStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  pendingSyncText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#d97706',
  },
  syncProgress: {
    marginTop: 8,
  },
  syncProgressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  syncButton: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  taskInfo: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  taskFlock: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  taskDueDate: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  taskStatus: {
    alignItems: 'flex-end',
  },
  priorityChip: {
    marginBottom: 4,
  },
  statusChip: {
    marginBottom: 4,
  },
  quickDataEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dataEntryButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dataEntryText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  flockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  flockInfo: {
    flex: 1,
  },
  flockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  flockBreed: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  flockDetails: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  flockStatus: {
    alignItems: 'flex-end',
  },
  healthChip: {
    marginBottom: 4,
  },
  unreadChip: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notificationMessage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#16a34a',
  },
});