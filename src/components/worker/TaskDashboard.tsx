import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { workerAPI } from '../../services/api';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  recurrenceFrequency: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  recurrenceEndDate: string | null;
  completedAt: string | null;
  nextOccurrence?: string;
}

interface TaskDashboardProps {
  farmWorkerId?: string;
  isOnline: boolean;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Morning feeding',
    description: 'Feed broiler batch A with 25kg starter feed',
    priority: 'HIGH',
    status: 'COMPLETED',
    dueDate: '2024-01-15T09:00:00Z',
    recurrenceFrequency: 'DAILY',
    recurrenceEndDate: null,
    completedAt: '2024-01-15T09:00:00Z',
    nextOccurrence: '2024-01-16T09:00:00Z',
  },
  {
    id: '2',
    title: 'Health check',
    description: 'Daily health monitoring and temperature check',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: '2024-01-15T14:00:00Z',
    recurrenceFrequency: 'DAILY',
    recurrenceEndDate: null,
    completedAt: null,
    nextOccurrence: '2024-01-16T14:00:00Z',
  },
  {
    id: '3',
    title: 'Weight measurement',
    description: 'Weekly weight sampling for broiler batch A',
    priority: 'LOW',
    status: 'PENDING',
    dueDate: '2024-01-16T10:00:00Z',
    recurrenceFrequency: 'WEEKLY',
    recurrenceEndDate: null,
    completedAt: null,
    nextOccurrence: '2024-01-23T10:00:00Z',
  },
  {
    id: '4',
    title: 'Egg collection',
    description: 'Collect eggs from layer flock B',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '2024-01-15T16:00:00Z',
    recurrenceFrequency: 'DAILY',
    recurrenceEndDate: null,
    completedAt: null,
    nextOccurrence: '2024-01-16T16:00:00Z',
  },
];

export default function TaskDashboard({ farmWorkerId, isOnline }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Calculate next occurrence for recurring tasks
  const calculateNextOccurrence = (task: Task): string => {
    if (!task.recurrenceFrequency || task.recurrenceFrequency === 'NONE') {
      return task.dueDate;
    }

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    let nextDate = dueDate;

    // If the task is completed, calculate from completion date
    if (task.completedAt) {
      nextDate = new Date(task.completedAt);
    }

    // Calculate next occurrence based on frequency
    switch (task.recurrenceFrequency) {
      case 'DAILY':
        nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'WEEKLY':
        nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'MONTHLY':
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
        break;
    }

    // Check if next occurrence is before end date
    if (task.recurrenceEndDate && nextDate > new Date(task.recurrenceEndDate)) {
      return task.dueDate; // Return original due date if past end date
    }

    return nextDate.toISOString();
  };

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!farmWorkerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const tasksData = await workerAPI.getTasks();
        
        // Process tasks to add next occurrence for recurring tasks
        const processedTasks = tasksData.map((task: Task) => ({
          ...task,
          nextOccurrence: calculateNextOccurrence(task),
        }));
        
        setTasks(processedTasks);
        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [farmWorkerId]);

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    if (!farmWorkerId) return;

    try {
      // Call appropriate API based on status
      if (newStatus === 'IN_PROGRESS') {
        await workerAPI.startTask(taskId);
      } else if (newStatus === 'COMPLETED') {
        await workerAPI.completeTask(taskId);
      }

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { 
                ...task, 
                status: newStatus, 
                completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
                nextOccurrence: newStatus === 'COMPLETED' ? calculateNextOccurrence({
                  ...task,
                  completedAt: new Date().toISOString(),
                }) : task.nextOccurrence,
              }
            : task
        )
      );

      Alert.alert('Task updated', `Task marked as ${newStatus.toLowerCase()}`);
    } catch (err) {
      console.error('Error updating task:', err);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (filter === 'all') return true;
    if (filter === 'today') return taskDate.getTime() === today.getTime();
    if (filter === 'upcoming') return dueDate > now;
    if (filter === 'overdue') return dueDate < now && task.status !== 'COMPLETED';
    if (filter === 'completed') return task.status === 'COMPLETED';
    if (filter === 'recurring') return task.recurrenceFrequency !== 'NONE' && task.recurrenceFrequency !== null;
    return true;
  });

  // Get priority color
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return '#dc2626';
      case 'MEDIUM':
        return '#d97706';
      case 'LOW':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };

  // Get status color
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return '#16a34a';
      case 'IN_PROGRESS':
        return '#2563eb';
      case 'PENDING':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  // Get recurrence text
  const getRecurrenceText = (task: Task) => {
    if (!task.recurrenceFrequency || task.recurrenceFrequency === 'NONE') {
      return 'One-time';
    }

    const endDate = task.recurrenceEndDate
      ? ` until ${new Date(task.recurrenceEndDate).toLocaleDateString()}`
      : '';

    const nextOccurrence = task.nextOccurrence
      ? ` (Next: ${new Date(task.nextOccurrence).toLocaleDateString()})`
      : '';

    switch (task.recurrenceFrequency) {
      case 'DAILY':
        return `Daily${endDate}${nextOccurrence}`;
      case 'WEEKLY':
        return `Weekly${endDate}${nextOccurrence}`;
      case 'MONTHLY':
        return `Monthly${endDate}${nextOccurrence}`;
      default:
        return 'One-time';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={32} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Your Tasks</Title>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'completed', label: 'Completed' },
            { value: 'recurring', label: 'Recurring' },
          ]}
          style={styles.filterButtons}
        />
      </View>

      <Card style={styles.tasksCard}>
        <Card.Content style={styles.tasksContent}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <View style={styles.taskTitleRow}>
                      <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => {
                          updateTaskStatus(
                            task.id,
                            task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                          );
                        }}
                        disabled={!isOnline}
                      >
                        <Icon
                          name={task.status === 'COMPLETED' ? 'check-circle' : 'circle-outline'}
                          size={24}
                          color={task.status === 'COMPLETED' ? '#16a34a' : '#6b7280'}
                        />
                      </TouchableOpacity>
                      <View style={styles.taskTitleContainer}>
                        <Text style={[
                          styles.taskTitle,
                          task.status === 'COMPLETED' && styles.completedTaskTitle
                        ]}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text style={styles.taskDescription}>
                            {task.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.taskDetails}>
                  <View style={styles.detailRow}>
                    <Icon name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{formatDate(task.dueDate)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Icon name="repeat" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{getRecurrenceText(task)}</Text>
                  </View>
                </View>

                <View style={styles.taskFooter}>
                  <View style={styles.badgesContainer}>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getPriorityColor(task.priority) }}
                      style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
                    >
                      {task.priority}
                    </Chip>
                    
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(task.status) }}
                      style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
                    >
                      {task.status}
                    </Chip>
                  </View>

                  <View style={styles.actionButtons}>
                    {task.status === 'PENDING' && (
                      <Button
                        mode="outlined"
                        onPress={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                        disabled={!isOnline}
                        style={styles.actionButton}
                        compact
                      >
                        Start
                      </Button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        mode="outlined"
                        onPress={() => updateTaskStatus(task.id, 'COMPLETED')}
                        disabled={!isOnline}
                        style={styles.actionButton}
                        compact
                      >
                        Complete
                      </Button>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="clipboard-list" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No tasks found</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  filterButtons: {
    marginBottom: 8,
  },
  tasksCard: {
    elevation: 2,
  },
  tasksContent: {
    padding: 0,
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskTitleContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    marginBottom: 4,
  },
  statusChip: {
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderColor: '#16a34a',
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
    color: '#dc2626',
    textAlign: 'center',
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
});
