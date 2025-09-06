import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB, Chip, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { farmerAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface Farm {
  id: string;
  name: string;
  farmType: string[];
  farmSize?: number;
  address?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  flockCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Flock {
  id: string;
  name: string;
  breed: string;
  species: string;
  quantity: number;
  unitPrice?: number;
  age?: number;
  status: string;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  mortality?: number;
  dailyRecords?: any[];
  health?: string;
  feedConversion?: number;
  farm: {
    id: string;
    name: string;
  };
}

interface FinancialData {
  revenue: number;
  expenses: number;
  profit: number;
  feedCosts: number;
  laborCosts: number;
  otherCosts: number;
}

interface WorkerActivity {
  id: string;
  workerName: string;
  activity: string;
  timestamp: string;
  flockName?: string;
  status: 'completed' | 'pending' | 'in_progress';
}

export default function FarmerDashboard() {
  const navigation = useNavigation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for now - will be replaced with API calls
  const [financialData] = useState<FinancialData>({
    revenue: 1250000,
    expenses: 850000,
    profit: 400000,
    feedCosts: 450000,
    laborCosts: 250000,
    otherCosts: 150000,
  });

  const [workerActivities] = useState<WorkerActivity[]>([
    {
      id: '1',
      workerName: 'John Kamau',
      activity: 'Morning feeding completed',
      timestamp: '2024-01-15T08:00:00Z',
      flockName: 'Broiler Batch A',
      status: 'completed',
    },
    {
      id: '2',
      workerName: 'Mary Wanjiku',
      activity: 'Health check in progress',
      timestamp: '2024-01-15T09:30:00Z',
      flockName: 'Layer Flock B',
      status: 'in_progress',
    },
    {
      id: '3',
      workerName: 'Peter Mwangi',
      activity: 'Weight measurement scheduled',
      timestamp: '2024-01-15T10:00:00Z',
      flockName: 'Broiler Batch A',
      status: 'pending',
    },
  ]);

  useEffect(() => {
    loadUserData();
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      loadFlocks(selectedFarm.id);
    }
  }, [selectedFarm]);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadFarms = async () => {
    try {
      setIsLoading(true);
      const response = await farmerAPI.getFarms();
      setFarms(response.farms || response || []);
      if ((response.farms || response) && (response.farms || response).length > 0) {
        setSelectedFarm((response.farms || response)[0]);
      }
    } catch (error) {
      console.error('Error loading farms:', error);
      Alert.alert('Error', 'Failed to load farms');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFlocks = async (farmId: string) => {
    try {
      setIsLoading(true);
      const response = await farmerAPI.getFlocks(farmId);
      setFlocks(response.flocks || response || []);
    } catch (error) {
      console.error('Error loading flocks:', error);
      Alert.alert('Error', 'Failed to load flocks');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFarms();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#16a34a';
      case 'completed':
        return '#2563eb';
      case 'inactive':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getHealthBadge = (health: string) => {
    if (!health) return { color: '#6b7280', text: 'Unknown' };
    
    if (health.toLowerCase().includes('excellent')) {
      return { color: '#16a34a', text: 'Excellent' };
    } else if (health.toLowerCase().includes('good')) {
      return { color: '#2563eb', text: 'Good' };
    } else if (health.toLowerCase().includes('fair')) {
      return { color: '#d97706', text: 'Fair' };
    } else {
      return { color: '#dc2626', text: 'Poor' };
    }
  };

  const calculateAge = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProductionPhase = (age: number, breed: string) => {
    if (breed.toLowerCase().includes('broiler')) {
      if (age <= 21) return 'Starter';
      if (age <= 35) return 'Grower';
      return 'Finisher';
    } else if (breed.toLowerCase().includes('layer')) {
      if (age <= 8) return 'Chick';
      if (age <= 20) return 'Grower';
      if (age <= 72) return 'Layer';
      return 'Mature';
    }
    return 'Unknown';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
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

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in_progress': return '#2563eb';
      case 'pending': return '#d97706';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading your farm data...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.welcomeText}>
              Welcome back, {userData?.name || 'Farmer'}! 👋
            </Text>
            <Text style={styles.subtitleText}>
              Your farm at a glance: finances, team, AI insights, and tasks.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Icon name="account-circle" size={32} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Farm Selection */}
        {farms.length > 0 && (
          <Card style={styles.farmSelectionCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Select Farm</Title>
              <View style={styles.farmPickerContainer}>
                <Text style={styles.farmLabel}>Current Farm:</Text>
                <TouchableOpacity
                  style={styles.farmSelector}
                  onPress={() => {
                    Alert.alert(
                      'Select Farm',
                      'Choose a farm to manage:',
                      farms.map(farm => ({
                        text: farm.name,
                        onPress: () => setSelectedFarm(farm),
                      }))
                    );
                  }}
                >
                  <Text style={styles.selectedFarmText}>
                    {selectedFarm?.name || 'Select a farm'}
                  </Text>
                  <Icon name="chevron-down" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Financial Breakdown Chart */}
        <Card style={styles.financialCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Financial Overview</Title>
            <View style={styles.financialGrid}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Revenue</Text>
                <Text style={[styles.financialValue, styles.revenueText]}>
                  {formatCurrency(financialData.revenue)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Expenses</Text>
                <Text style={[styles.financialValue, styles.expenseText]}>
                  {formatCurrency(financialData.expenses)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Profit</Text>
                <Text style={[styles.financialValue, styles.profitText]}>
                  {formatCurrency(financialData.profit)}
                </Text>
              </View>
            </View>
            
            <View style={styles.expenseBreakdown}>
              <Text style={styles.breakdownTitle}>Expense Breakdown</Text>
              <View style={styles.expenseItem}>
                <Text style={styles.expenseItemLabel}>Feed Costs</Text>
                <Text style={styles.expenseItemValue}>
                  {formatCurrency(financialData.feedCosts)}
                </Text>
              </View>
              <View style={styles.expenseItem}>
                <Text style={styles.expenseItemLabel}>Labor Costs</Text>
                <Text style={styles.expenseItemValue}>
                  {formatCurrency(financialData.laborCosts)}
                </Text>
              </View>
              <View style={styles.expenseItem}>
                <Text style={styles.expenseItemLabel}>Other Costs</Text>
                <Text style={styles.expenseItemValue}>
                  {formatCurrency(financialData.otherCosts)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Health Alerts Panel */}
        <Card style={styles.healthAlertsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Health Alerts</Title>
            <View style={styles.healthAlertsList}>
              <View style={styles.healthAlertItem}>
                <View style={styles.alertHeader}>
                  <Icon name="alert-circle" size={20} color="#dc2626" />
                  <Text style={styles.alertTitle}>High Mortality Rate</Text>
                  <Chip mode="outlined" style={styles.severityChip}>
                    Critical
                  </Chip>
                </View>
                <Text style={styles.alertMessage}>
                  Broiler Batch A showing 15% mortality rate - immediate attention required
                </Text>
                <Text style={styles.alertDate}>2 hours ago</Text>
              </View>
              <View style={styles.healthAlertItem}>
                <View style={styles.alertHeader}>
                  <Icon name="alert" size={20} color="#d97706" />
                  <Text style={styles.alertTitle}>Feed Consumption Drop</Text>
                  <Chip mode="outlined" style={styles.severityChip}>
                    Warning
                  </Chip>
                </View>
                <Text style={styles.alertMessage}>
                  Layer Flock B consuming 20% less feed than usual
                </Text>
                <Text style={styles.alertDate}>4 hours ago</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Health' as never)}
            >
              <Text style={styles.viewAllText}>View All Health Records</Text>
              <Icon name="chevron-right" size={16} color="#16a34a" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Veterinary Corner */}
        <Card style={styles.veterinaryCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Veterinary Corner</Title>
            <View style={styles.veterinaryTabs}>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('Health' as never)}
              >
                <Text style={styles.tabButtonText}>Consultations</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('Health' as never)}
              >
                <Text style={styles.tabButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.veterinaryContent}>
              <View style={styles.consultationItem}>
                <View style={styles.consultationHeader}>
                  <Icon name="video" size={20} color="#16a34a" />
                  <Text style={styles.consultationTitle}>Dr. Sarah Kimani</Text>
                  <Chip mode="outlined" style={styles.statusChip}>
                    Scheduled
                  </Chip>
                </View>
                <Text style={styles.consultationDetails}>
                  Video consultation for Broiler Batch A health check
                </Text>
                <Text style={styles.consultationDate}>Tomorrow, 2:00 PM</Text>
              </View>
              <View style={styles.consultationItem}>
                <View style={styles.consultationHeader}>
                  <Icon name="message" size={20} color="#2563eb" />
                  <Text style={styles.consultationTitle}>Dr. John Mwangi</Text>
                  <Chip mode="outlined" style={styles.statusChip}>
                    In Progress
                  </Chip>
                </View>
                <Text style={styles.consultationDetails}>
                  Chat consultation about feed recommendations
                </Text>
                <Text style={styles.consultationDate}>Active now</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Health' as never)}
            >
              <Text style={styles.viewAllText}>View All Consultations</Text>
              <Icon name="chevron-right" size={16} color="#16a34a" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Worker Activity Feed */}
        <Card style={styles.workerActivityCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Worker Activity</Title>
            <View style={styles.workerActivityList}>
              {workerActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.workerName}>{activity.workerName}</Text>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getActivityStatusColor(activity.status) }}
                      style={[styles.statusChip, { borderColor: getActivityStatusColor(activity.status) }]}
                    >
                      {activity.status.replace('_', ' ')}
                    </Chip>
                  </View>
                  <Text style={styles.activityText}>{activity.activity}</Text>
                  {activity.flockName && (
                    <Text style={styles.flockName}>Flock: {activity.flockName}</Text>
                  )}
                  <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Workers' as never)}
            >
              <Text style={styles.viewAllText}>View All Activities</Text>
              <Icon name="chevron-right" size={16} color="#16a34a" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Feed Usage vs Stock */}
        <Card style={styles.feedUsageCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Feed Usage vs Stock</Title>
            <View style={styles.feedMetrics}>
              <View style={styles.feedMetric}>
                <Icon name="food-apple" size={24} color="#16a34a" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>2,450 kg</Text>
                  <Text style={styles.metricLabel}>Current Stock</Text>
                </View>
              </View>
              <View style={styles.feedMetric}>
                <Icon name="scale-balance" size={24} color="#d97706" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>180 kg/day</Text>
                  <Text style={styles.metricLabel}>Daily Usage</Text>
                </View>
              </View>
            </View>
            <View style={styles.stockWarning}>
              <Icon name="alert-circle" size={20} color="#d97706" />
              <Text style={styles.warningText}>
                Low stock alert: Reorder feed within 3 days
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Marketplace Section */}
        <Card style={styles.marketplaceCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Marketplace</Title>
            <Text style={styles.marketplaceSubtitle}>
              Buy and sell farm products, equipment, and supplies
            </Text>
            <View style={styles.marketplaceActions}>
              <TouchableOpacity
                style={styles.marketplaceButton}
                onPress={() => navigation.navigate('Marketplace' as never)}
              >
                <Icon name="store" size={20} color="#16a34a" />
                <Text style={styles.marketplaceButtonText}>Browse Products</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.marketplaceButton}
                onPress={() => navigation.navigate('Marketplace' as never)}
              >
                <Icon name="plus" size={20} color="#2563eb" />
                <Text style={styles.marketplaceButtonText}>List Product</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Farm Tasks */}
        <Card style={styles.tasksCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Farm Tasks</Title>
            <View style={styles.taskList}>
              <View style={styles.taskItem}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>Vaccinate Broiler Batch A</Text>
                  <Text style={styles.taskDescription}>Due today - Newcastle disease vaccine</Text>
                </View>
                <Chip mode="outlined" style={styles.priorityChip}>
                  High Priority
                </Chip>
              </View>
              <View style={styles.taskItem}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>Weight Measurement</Text>
                  <Text style={styles.taskDescription}>Due tomorrow - Sample 50 birds</Text>
                </View>
                <Chip mode="outlined" style={styles.priorityChip}>
                  Medium Priority
                </Chip>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Tasks' as never)}
            >
              <Text style={styles.viewAllText}>View All Tasks</Text>
              <Icon name="chevron-right" size={16} color="#16a34a" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Farm & Flock' as never)}
              >
                <Icon name="plus" size={24} color="#16a34a" />
                <Text style={styles.quickActionText}>Add Flock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Workers' as never)}
              >
                <Icon name="account-plus" size={24} color="#2563eb" />
                <Text style={styles.quickActionText}>Add Worker</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Financial' as never)}
              >
                <Icon name="chart-line" size={24} color="#d97706" />
                <Text style={styles.quickActionText}>View Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Marketplace' as never)}
              >
                <Icon name="store" size={24} color="#7c3aed" />
                <Text style={styles.quickActionText}>Marketplace</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* No Farms Message */}
        {farms.length === 0 && (
          <Card style={styles.noFarmsCard}>
            <Card.Content style={styles.noFarmsContent}>
              <Icon name="farm" size={64} color="#9ca3af" />
              <Title style={styles.noFarmsTitle}>No Farms Yet</Title>
              <Paragraph style={styles.noFarmsText}>
                Get started by creating your first farm and adding some flocks.
              </Paragraph>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Farm & Flock' as never)}
                style={styles.createFarmButton}
              >
                Create Your First Farm
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Farm & Flock' as never)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  farmSelectionCard: {
    margin: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  farmPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  farmLabel: {
    fontSize: 16,
    color: '#374151',
    marginRight: 12,
  },
  farmSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  selectedFarmText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  financialCard: {
    margin: 16,
    elevation: 2,
  },
  financialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  financialItem: {
    alignItems: 'center',
    flex: 1,
  },
  financialLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  revenueText: {
    color: '#16a34a',
  },
  expenseText: {
    color: '#dc2626',
  },
  profitText: {
    color: '#2563eb',
  },
  expenseBreakdown: {
    marginTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseItemLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  expenseItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  workerActivityCard: {
    margin: 16,
    elevation: 2,
  },
  workerActivityList: {
    marginTop: 16,
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusChip: {
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  flockName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  viewAllText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  feedUsageCard: {
    margin: 16,
    elevation: 2,
  },
  feedMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  feedMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricContent: {
    marginLeft: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  stockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  marketplaceCard: {
    margin: 16,
    elevation: 2,
  },
  marketplaceSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 16,
  },
  marketplaceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  marketplaceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  marketplaceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tasksCard: {
    margin: 16,
    elevation: 2,
  },
  taskList: {
    marginTop: 16,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  priorityChip: {
    borderColor: '#d97706',
  },
  quickActionsCard: {
    margin: 16,
    elevation: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionButton: {
    width: (width - 64) / 2 - 8,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  noFarmsCard: {
    margin: 16,
    elevation: 2,
  },
  noFarmsContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noFarmsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  noFarmsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createFarmButton: {
    backgroundColor: '#16a34a',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#16a34a',
  },
  healthAlertsCard: {
    margin: 16,
    elevation: 2,
  },
  healthAlertsList: {
    marginTop: 16,
  },
  healthAlertItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  severityChip: {
    borderColor: '#dc2626',
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  alertDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  veterinaryCard: {
    margin: 16,
    elevation: 2,
  },
  veterinaryTabs: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  veterinaryContent: {
    marginTop: 16,
  },
  consultationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  consultationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  consultationDetails: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  consultationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
