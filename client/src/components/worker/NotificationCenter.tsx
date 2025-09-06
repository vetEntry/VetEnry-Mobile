import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Card, Title, Button, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { commonAPI } from '../../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  link?: string | null;
}

interface NotificationCenterProps {
  userId?: string;
  isOnline: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Task Reminder',
    message: 'Health check for Layer Flock B is due in 2 hours',
    type: 'task',
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
  {
    id: '4',
    title: 'New Message',
    message: 'You have a new message from the farm manager',
    type: 'message',
    isRead: false,
    createdAt: '2024-01-15T08:45:00Z',
  },
  {
    id: '5',
    title: 'System Update',
    message: 'App will be updated tonight at 2 AM',
    type: 'system',
    isRead: true,
    createdAt: '2024-01-14T16:20:00Z',
  },
];

export default function NotificationCenter({ userId, isOnline }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const notificationsData = await commonAPI.getNotifications();
        setNotifications(notificationsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
        
        // If offline, show a message but don't break the component
        if (!isOnline) {
          setError('You are offline. Notifications will update when you reconnect.');
        }
      }
    };
    
    fetchNotifications();
  }, [userId, isOnline]);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    return notification.type.toLowerCase() === activeTab;
  });

  // Format the relative time for display
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return 'just now';
    }
    
    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    if (diffSeconds < 2 * 86400) {
      return 'yesterday';
    }
    
    if (diffSeconds < 7 * 86400) {
      const days = Math.floor(diffSeconds / 86400);
      return `${days} days ago`;
    }
    
    return date.toLocaleDateString();
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        'This action requires an internet connection',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!userId || unreadCount === 0) return;
    
    try {
      // Optimistically update UI
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      
      await commonAPI.markAllNotificationsAsRead();
      
      Alert.alert(
        'Notifications updated',
        'All notifications marked as read',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      
      // Revert the optimistic update
      setNotifications(notifications.map(n => ({ ...n, isRead: false })));
      
      Alert.alert(
        'Failed to update',
        'Could not mark notifications as read',
        [{ text: 'OK' }]
      );
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    // Don't do anything if already read
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return;
    
    // Optimistically update UI
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        "This notification will be marked as read when you're back online",
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await commonAPI.markNotificationAsRead(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      
      // Revert the optimistic update
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: false } : n));
      
      Alert.alert(
        'Failed to update',
        'Could not mark notification as read',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle notification click (mark as read and follow link if provided)
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      Alert.alert('Link', `Would open: ${notification.link}`, [{ text: 'OK' }]);
    }
  };

  // Icons for different notification types
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'message':
        return 'message-text';
      case 'task':
        return 'calendar';
      case 'alert':
        return 'alert-circle';
      case 'system':
        return 'information';
      default:
        return 'bell';
    }
  };

  // Colors for different notification types
  const getIconColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'message':
        return '#2563eb';
      case 'task':
        return '#16a34a';
      case 'alert':
        return '#dc2626';
      case 'system':
        return '#7c3aed';
      default:
        return '#6b7280';
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Title style={styles.headerTitle}>Notifications</Title>
            {unreadCount > 0 && (
              <Chip mode="outlined" style={styles.unreadChip}>
                {unreadCount} new
              </Chip>
            )}
          </View>

          {unreadCount > 0 && (
            <Button 
              mode="outlined"
              onPress={markAllAsRead} 
              disabled={!isOnline}
              style={styles.markAllButton}
              compact
            >
              <Text style={styles.markAllButtonText}>Mark all as read</Text>
            </Button>
          )}
        </View>

        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'message', label: 'Messages' },
            { value: 'task', label: 'Tasks' },
            { value: 'alert', label: 'Alerts' },
          ]}
          style={styles.tabButtons}
        />

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={32} color="#d97706" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadNotification
                ]}
                onPress={() => handleNotificationClick(notification)}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationIcon}>
                    <Icon 
                      name={getIcon(notification.type)} 
                      size={20} 
                      color={getIconColor(notification.type)} 
                    />
                  </View>
                  
                  <View style={styles.notificationDetails}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {!notification.isRead && (
                        <Chip mode="outlined" style={styles.newChip}>
                          <Text style={styles.newChipText}>New</Text>
                        </Chip>
                      )}
                    </View>
                    
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    
                    <View style={styles.notificationFooter}>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                      {notification.link && (
                        <Text style={styles.linkText}>View details</Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="check-circle" size={32} color="#9ca3af" />
              <Text style={styles.emptyText}>No notifications to display</Text>
            </View>
          )}
          
          {!isOnline && notifications.length > 0 && (
            <View style={styles.offlineWarning}>
              <Icon name="alert-triangle" size={16} color="#d97706" />
              <Text style={styles.offlineWarningText}>
                You're offline. Notifications may not be up to date.
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  unreadChip: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  markAllButton: {
    borderColor: '#16a34a',
  },
  markAllButtonText: {
    fontSize: 12,
    color: '#16a34a',
  },
  tabButtons: {
    marginBottom: 16,
  },
  content: {
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#d97706',
    textAlign: 'center',
  },
  notificationItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  unreadNotification: {
    backgroundColor: '#f8fafc',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  newChip: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  newChipText: {
    fontSize: 10,
    color: '#92400e',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  linkText: {
    fontSize: 12,
    color: '#2563eb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  offlineWarningText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
});
