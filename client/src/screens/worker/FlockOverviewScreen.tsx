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
import { Card, Title, Paragraph, Button, Chip, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { workerAPI } from '../../services/api';

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
  lastDataEntry?: string;
  mortalityRate?: number;
  feedConsumption?: number;
  eggProduction?: number;
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
    lastDataEntry: '2024-01-15T08:00:00Z',
    mortalityRate: 0.5,
    feedConsumption: 125,
    eggProduction: 0,
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
    lastDataEntry: '2024-01-14T16:30:00Z',
    mortalityRate: 1.2,
    feedConsumption: 90,
    eggProduction: 280,
  },
  {
    id: '3',
    name: 'Kienyeji Flock C',
    breed: 'Kienyeji',
    species: 'Chicken',
    status: 'Active',
    farmId: 'farm2',
    healthStatus: 'Fair',
    totalBirds: 150,
    age: 60,
    lastDataEntry: '2024-01-13T10:15:00Z',
    mortalityRate: 2.1,
    feedConsumption: 45,
    eggProduction: 120,
  },
];

export default function FlockOverviewScreen() {
  const navigation = useNavigation();
  const [flocks, setFlocks] = useState<AssignedFlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlocks();
  }, []);

  const fetchFlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const flocksData = await workerAPI.getFlocks();
      setFlocks(flocksData);
    } catch (err) {
      console.error('Error fetching flocks:', err);
      setError('Failed to load flock data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFlocks();
    setRefreshing(false);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#16a34a';
      case 'inactive': return '#6b7280';
      case 'quarantine': return '#dc2626';
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

  const renderFlockCard = (flock: AssignedFlock) => (
    <Card key={flock.id} style={styles.flockCard}>
      <Card.Content>
        <View style={styles.flockHeader}>
          <View style={styles.flockTitle}>
            <Text style={styles.flockName}>{flock.name}</Text>
            <Text style={styles.flockBreed}>{flock.breed} • {flock.species}</Text>
          </View>
          <View style={styles.flockStatus}>
            <Chip
              mode="outlined"
              textStyle={{ color: getHealthColor(flock.healthStatus) }}
              style={[styles.healthChip, { borderColor: getHealthColor(flock.healthStatus) }]}
            >
              {flock.healthStatus}
            </Chip>
            <Chip
              mode="outlined"
              textStyle={{ color: getStatusColor(flock.status) }}
              style={[styles.statusChip, { borderColor: getStatusColor(flock.status) }]}
            >
              {flock.status}
            </Chip>
          </View>
        </View>

        <View style={styles.flockDetails}>
          <View style={styles.detailRow}>
            <Icon name="egg" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{flock.totalBirds} birds</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{flock.age} days old</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="home" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Farm {flock.farmId}</Text>
          </View>
        </View>

        {flock.lastDataEntry && (
          <View style={styles.lastEntryRow}>
            <Icon name="clock" size={16} color="#9ca3af" />
            <Text style={styles.lastEntryText}>
              Last entry: {formatDate(flock.lastDataEntry)}
            </Text>
          </View>
        )}

        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Mortality Rate</Text>
            <Text style={[styles.metricValue, { color: flock.mortalityRate && flock.mortalityRate > 2 ? '#dc2626' : '#16a34a' }]}>
              {flock.mortalityRate}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Feed (kg/day)</Text>
            <Text style={styles.metricValue}>{flock.feedConsumption}</Text>
          </View>
          {flock.eggProduction !== undefined && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Eggs/day</Text>
              <Text style={styles.metricValue}>{flock.eggProduction}</Text>
            </View>
          )}
        </View>

        <View style={styles.flockActions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('DataEntry' as never)}
            style={styles.actionButton}
            compact
          >
            <Icon name="database-plus" size={16} color="#16a34a" />
            <Text style={styles.actionButtonText}>Data Entry</Text>
          </Button>
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Coming Soon', 'Health monitoring will be available soon')}
            style={styles.actionButton}
            compact
          >
            <Icon name="heart-pulse" size={16} color="#dc2626" />
            <Text style={styles.actionButtonText}>Health</Text>
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading flocks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchFlocks} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (flocks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="egg" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Flocks Assigned</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any flocks assigned to you yet.
          </Text>
          <Button mode="contained" onPress={fetchFlocks} style={styles.refreshButton}>
            Refresh
          </Button>
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
          <Text style={styles.headerTitle}>Flock Overview</Text>
          <Text style={styles.headerSubtitle}>
            Monitor your assigned flocks and their health status
          </Text>
        </View>

        {/* Summary Stats */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Summary</Title>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{flocks.length}</Text>
                <Text style={styles.summaryLabel}>Total Flocks</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {flocks.reduce((sum, flock) => sum + flock.totalBirds, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Total Birds</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {flocks.filter(f => f.healthStatus === 'Excellent' || f.healthStatus === 'Good').length}
                </Text>
                <Text style={styles.summaryLabel}>Healthy Flocks</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Flocks List */}
        <View style={styles.flocksContainer}>
          {flocks.map(renderFlockCard)}
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#16a34a',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: '#16a34a',
  },
  summaryCard: {
    margin: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  flocksContainer: {
    padding: 16,
    paddingTop: 0,
  },
  flockCard: {
    marginBottom: 16,
    elevation: 2,
  },
  flockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  flockTitle: {
    flex: 1,
  },
  flockName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  flockBreed: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  flockStatus: {
    alignItems: 'flex-end',
  },
  healthChip: {
    marginBottom: 4,
  },
  statusChip: {
    marginBottom: 4,
  },
  flockDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#374151',
  },
  lastEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastEntryText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  flockActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
  },
});
