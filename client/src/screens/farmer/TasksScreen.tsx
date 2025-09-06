import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB, Chip, Dialog, Portal, TextInput as PaperTextInput, Switch } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { farmerAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedTo?: string;
  flockId?: string;
  flockName?: string;
  category: 'health' | 'feeding' | 'maintenance' | 'harvest' | 'other';
  createdAt: string;
  completedAt?: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Vaccinate Broiler Batch A',
    description: 'Administer Newcastle disease vaccine to all birds in Broiler Batch A',
    dueDate: '2024-01-15',
    priority: 'urgent',
    status: 'pending',
    assignedTo: 'John Kamau',
    flockId: '1',
    flockName: 'Broiler Batch A',
    category: 'health',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: '2',
    title: 'Weight Measurement',
    description: 'Sample 50 birds from Broiler Batch A for weight measurement',
    dueDate: '2024-01-16',
    priority: 'high',
    status: 'pending',
    assignedTo: 'Mary Wanjiku',
    flockId: '1',
    flockName: 'Broiler Batch A',
    category: 'health',
    createdAt: '2024-01-10T09:00:00Z',
  },
  {
    id: '3',
    title: 'Feed Stock Check',
    description: 'Check current feed stock levels and reorder if necessary',
    dueDate: '2024-01-18',
    priority: 'medium',
    status: 'pending',
    category: 'feeding',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '4',
    title: 'Coop Maintenance',
    description: 'Repair damaged wire mesh in Layer Flock B coop',
    dueDate: '2024-01-20',
    priority: 'low',
    status: 'pending',
    category: 'maintenance',
    createdAt: '2024-01-10T11:00:00Z',
  },
  {
    id: '5',
    title: 'Egg Collection',
    description: 'Collect eggs from Layer Flock B and record production',
    dueDate: '2024-01-15',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Peter Mwangi',
    flockId: '2',
    flockName: 'Layer Flock B',
    category: 'harvest',
    createdAt: '2024-01-10T12:00:00Z',
  },
];

export default function TasksScreen() {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'health' | 'feeding' | 'maintenance' | 'harvest' | 'other'>('all');

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'other' as 'health' | 'feeding' | 'maintenance' | 'harvest' | 'other',
    assignedTo: '',
    flockId: '',
  });

  useEffect(() => {
    // Load tasks from API when implemented
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await farmerAPI.getTasks();
      setTasks(response.tasks || response || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
      // Fallback to mock data if API fails
      setTasks(mockTasks);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskForm.title || !taskForm.description || !taskForm.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo || undefined,
        flockId: taskForm.flockId || undefined,
        category: taskForm.category,
      };

      const response = await farmerAPI.createTask(taskData);
      const newTask = response.task || response;
      
      setTasks(prev => [...prev, newTask]);
      Alert.alert('Success', 'Task created successfully');
      setShowAddTaskDialog(false);
      resetTaskForm();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !taskForm.title || !taskForm.description || !taskForm.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        category: taskForm.category,
        assignedTo: taskForm.assignedTo || undefined,
        flockId: taskForm.flockId || undefined,
      };

      const response = await farmerAPI.updateTask(editingTask.id, taskData);
      const updatedTask = response.task || response;

      setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      Alert.alert('Success', 'Task updated successfully');
      setShowEditTaskDialog(false);
      setEditingTask(null);
      resetTaskForm();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
          }
        : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await farmerAPI.deleteTask(taskId);
              setTasks(prev => prev.filter(task => task.id !== taskId));
              Alert.alert('Success', 'Task deleted successfully');
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: 'other',
      assignedTo: '',
      flockId: '',
    });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
      assignedTo: task.assignedTo || '',
      flockId: task.flockId || '',
    });
    setShowEditTaskDialog(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#d97706';
      case 'medium': return '#2563eb';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in_progress': return '#2563eb';
      case 'pending': return '#d97706';
      case 'overdue': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return 'medical-bag';
      case 'feeding': return 'food-apple';
      case 'maintenance': return 'wrench';
      case 'harvest': return 'basket';
      default: return 'clipboard-text';
    }
  };

  const isOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = selectedFilter === 'all' || task.status === selectedFilter;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    
    return matchesFilter && matchesPriority && matchesCategory;
  });

  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const overdueTasks = tasks.filter(task => isOverdue(task.dueDate) && task.status !== 'completed').length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Tasks</Text>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => setShowAddTaskDialog(true)}
        >
          <Icon name="plus" size={24} color="#16a34a" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingTasks}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{inProgressTasks}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedTasks}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{overdueTasks}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.activeFilterChip]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.activeFilterChipText]}>
              All Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'pending' && styles.activeFilterChip]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'pending' && styles.activeFilterChipText]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'in_progress' && styles.activeFilterChip]}
            onPress={() => setSelectedFilter('in_progress')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'in_progress' && styles.activeFilterChipText]}>
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'completed' && styles.activeFilterChip]}
            onPress={() => setSelectedFilter('completed')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'completed' && styles.activeFilterChipText]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'overdue' && styles.activeFilterChip]}
            onPress={() => setSelectedFilter('overdue')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'overdue' && styles.activeFilterChipText]}>
              Overdue
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityFilters}>
          <TouchableOpacity
            style={[styles.filterChip, selectedPriority === 'all' && styles.activeFilterChip]}
            onPress={() => setSelectedPriority('all')}
          >
            <Text style={[styles.filterChipText, selectedPriority === 'all' && styles.activeFilterChipText]}>
              All Priority
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedPriority === 'urgent' && styles.activeFilterChip]}
            onPress={() => setSelectedPriority('urgent')}
          >
            <Text style={[styles.filterChipText, selectedPriority === 'urgent' && styles.activeFilterChipText]}>
              Urgent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedPriority === 'high' && styles.activeFilterChip]}
            onPress={() => setSelectedPriority('high')}
          >
            <Text style={[styles.filterChipText, selectedPriority === 'high' && styles.activeFilterChipText]}>
              High
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedPriority === 'medium' && styles.activeFilterChip]}
            onPress={() => setSelectedPriority('medium')}
          >
            <Text style={[styles.filterChipText, selectedPriority === 'medium' && styles.activeFilterChipText]}>
              Medium
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedPriority === 'low' && styles.activeFilterChip]}
            onPress={() => setSelectedPriority('low')}
          >
            <Text style={[styles.filterChipText, selectedPriority === 'low' && styles.activeFilterChipText]}>
              Low
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tasks List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTasks.map((task) => (
          <Card key={task.id} style={styles.taskCard}>
            <Card.Content>
              <View style={styles.taskHeader}>
                <View style={styles.taskInfo}>
                  <View style={styles.taskTitleRow}>
                    <Icon 
                      name={getCategoryIcon(task.category)} 
                      size={20} 
                      color="#6b7280" 
                      style={styles.categoryIcon}
                    />
                    <Text style={styles.taskTitle}>{task.title}</Text>
                  </View>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  <Text style={styles.taskDetails}>
                    Due: {task.dueDate} • {task.assignedTo ? `Assigned to: ${task.assignedTo}` : 'Unassigned'}
                  </Text>
                  {task.flockName && (
                    <Text style={styles.flockName}>Flock: {task.flockName}</Text>
                  )}
                </View>
                <View style={styles.taskActions}>
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
                    {task.status.replace('_', ' ')}
                  </Chip>
                  {isOverdue(task.dueDate) && task.status !== 'completed' && (
                    <Chip
                      mode="outlined"
                      textStyle={{ color: '#dc2626' }}
                      style={[styles.overdueChip, { borderColor: '#dc2626' }]}
                    >
                      Overdue
                    </Chip>
                  )}
                </View>
              </View>

              <View style={styles.taskFooter}>
                <View style={styles.statusActions}>
                  {task.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.statusActionButton}
                      onPress={() => handleTaskStatusChange(task.id, 'in_progress')}
                    >
                      <Icon name="play" size={16} color="#2563eb" />
                      <Text style={styles.statusActionText}>Start</Text>
                    </TouchableOpacity>
                  )}
                  {task.status === 'in_progress' && (
                    <TouchableOpacity
                      style={styles.statusActionButton}
                      onPress={() => handleTaskStatusChange(task.id, 'completed')}
                    >
                      <Icon name="check" size={16} color="#16a34a" />
                      <Text style={styles.statusActionText}>Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditDialog(task)}
                  >
                    <Icon name="pencil" size={16} color="#2563eb" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Icon name="delete" size={16} color="#dc2626" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card style={styles.emptyStateCard}>
            <Card.Content style={styles.emptyStateContent}>
              <Icon name="clipboard-text" size={64} color="#9ca3af" />
              <Title style={styles.emptyStateTitle}>No Tasks Found</Title>
              <Paragraph style={styles.emptyStateText}>
                No tasks match your current filters. Try adjusting your selection or create a new task.
              </Paragraph>
              <Button
                mode="contained"
                onPress={() => setShowAddTaskDialog(true)}
                style={styles.addButton}
              >
                Create New Task
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Add Task Dialog */}
      <Portal>
        <Dialog visible={showAddTaskDialog} onDismiss={() => setShowAddTaskDialog(false)}>
          <Dialog.Title>Create New Task</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Task Title"
              value={taskForm.title}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, title: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Description"
              value={taskForm.description}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Due Date"
              value={taskForm.dueDate}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, dueDate: text }))}
              placeholder="YYYY-MM-DD"
              style={styles.dialogInput}
            />
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Priority:</Text>
                <View style={styles.priorityOptions}>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        taskForm.priority === priority && styles.selectedPriorityOption
                      ]}
                      onPress={() => setTaskForm(prev => ({ ...prev, priority }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        taskForm.priority === priority && styles.selectedPriorityOptionText
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category:</Text>
                <View style={styles.categoryOptions}>
                  {(['health', 'feeding', 'maintenance', 'harvest', 'other'] as const).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        taskForm.category === category && styles.selectedCategoryOption
                      ]}
                      onPress={() => setTaskForm(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        taskForm.category === category && styles.selectedCategoryOptionText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <PaperTextInput
              label="Assigned To (optional)"
              value={taskForm.assignedTo}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, assignedTo: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Flock ID (optional)"
              value={taskForm.flockId}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, flockId: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddTaskDialog(false)}>Cancel</Button>
            <Button onPress={handleAddTask}>Create Task</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Task Dialog */}
      <Portal>
        <Dialog visible={showEditTaskDialog} onDismiss={() => setShowEditTaskDialog(false)}>
          <Dialog.Title>Edit Task</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Task Title"
              value={taskForm.title}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, title: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Description"
              value={taskForm.description}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Due Date"
              value={taskForm.dueDate}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, dueDate: text }))}
              placeholder="YYYY-MM-DD"
              style={styles.dialogInput}
            />
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Priority:</Text>
                <View style={styles.priorityOptions}>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        taskForm.priority === priority && styles.selectedPriorityOption
                      ]}
                      onPress={() => setTaskForm(prev => ({ ...prev, priority }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        taskForm.priority === priority && styles.selectedPriorityOptionText
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category:</Text>
                <View style={styles.categoryOptions}>
                  {(['health', 'feeding', 'maintenance', 'harvest', 'other'] as const).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        taskForm.category === category && styles.selectedCategoryOption
                      ]}
                      onPress={() => setTaskForm(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        taskForm.category === category && styles.selectedCategoryOptionText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <PaperTextInput
              label="Assigned To (optional)"
              value={taskForm.assignedTo}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, assignedTo: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Flock ID (optional)"
              value={taskForm.flockId}
              onChangeText={(text) => setTaskForm(prev => ({ ...prev, flockId: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditTaskDialog(false)}>Cancel</Button>
            <Button onPress={handleEditTask}>Update Task</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  headerActionButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    marginHorizontal: 4,
  },
  activeFilterChip: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterChipText: {
    color: '#374151',
  },
  activeFilterChipText: {
    color: 'white',
  },
  priorityFilters: {
    marginTop: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    marginBottom: 16,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskDetails: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  flockName: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskActions: {
    alignItems: 'flex-end',
  },
  priorityChip: {
    marginBottom: 4,
  },
  statusChip: {
    marginBottom: 4,
  },
  overdueChip: {
    marginBottom: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  statusActionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  emptyStateCard: {
    marginTop: 32,
    elevation: 2,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#16a34a',
  },
  dialogInput: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  formRow: {
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  selectedPriorityOption: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedPriorityOptionText: {
    color: 'white',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedCategoryOption: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCategoryOptionText: {
    color: 'white',
  },
});
