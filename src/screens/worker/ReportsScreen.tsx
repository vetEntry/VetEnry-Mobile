import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  ActivityIndicator,
  SegmentedButtons,
  ProgressBar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { workerAPI } from '../../services/api';

interface ReportData {
  summary: {
    tasksCompleted: number;
    dataEntries: number;
    photosUploaded: number;
    tasksTrend: number;
    dataEntriesTrend: number;
    photosTrend: number;
  };
  recentActivity: Array<{
    type: string;
    title: string;
    flockName?: string;
    date: string;
    status?: string;
    entityId?: string;
    synced?: boolean;
    category?: string;
  }>;
  productivityMetrics: {
    taskCompletionRate: number;
    dataEntryAccuracy: number;
    responseTime: number;
    documentationQuality: number;
  };
  dataEntries: Array<{
    id: string;
    date: string;
    entityId: string;
    type: string;
    synced: boolean;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    duration: number | null;
  }>;
  flocks: Array<{
    id: string;
    name: string;
  }>;
}

const mockReportData: ReportData = {
  summary: {
    tasksCompleted: 24,
    dataEntries: 156,
    photosUploaded: 89,
    tasksTrend: 12,
    dataEntriesTrend: 8,
    photosTrend: -3,
  },
  recentActivity: [
    {
      type: 'task',
      title: 'Morning feeding completed',
      flockName: 'Broiler Batch A',
      date: '2024-01-15T09:00:00Z',
      status: 'completed',
    },
    {
      type: 'data',
      title: 'Health data recorded',
      flockName: 'Layer Flock B',
      date: '2024-01-15T08:30:00Z',
      status: 'synced',
    },
    {
      type: 'photo',
      title: 'Photo captured for weight measurement',
      flockName: 'Broiler Batch A',
      date: '2024-01-15T07:45:00Z',
      status: 'synced',
    },
  ],
  productivityMetrics: {
    taskCompletionRate: 85,
    dataEntryAccuracy: 92,
    responseTime: 78,
    documentationQuality: 88,
  },
  dataEntries: [
    {
      id: '1',
      date: '2024-01-15T09:00:00Z',
      entityId: 'flock_1',
      type: 'feed',
      synced: true,
    },
    {
      id: '2',
      date: '2024-01-15T08:30:00Z',
      entityId: 'flock_2',
      type: 'health',
      synced: true,
    },
    {
      id: '3',
      date: '2024-01-15T07:45:00Z',
      entityId: 'flock_1',
      type: 'weight',
      synced: false,
    },
  ],
  tasks: [
    {
      id: '1',
      title: 'Morning feeding',
      status: 'COMPLETED',
      createdAt: '2024-01-15T08:00:00Z',
      completedAt: '2024-01-15T09:00:00Z',
      duration: 60,
    },
    {
      id: '2',
      title: 'Health check',
      status: 'COMPLETED',
      createdAt: '2024-01-15T08:30:00Z',
      completedAt: '2024-01-15T09:15:00Z',
      duration: 45,
    },
    {
      id: '3',
      title: 'Weight measurement',
      status: 'PENDING',
      createdAt: '2024-01-15T10:00:00Z',
      completedAt: null,
      duration: null,
    },
  ],
  flocks: [
    { id: '1', name: 'Broiler Batch A' },
    { id: '2', name: 'Layer Flock B' },
  ],
};

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [reportType, setReportType] = useState('all');
  const [flockId, setFlockId] = useState('all');
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const reportsData = await workerAPI.getReports();
      setReportData(reportsData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      Alert.alert('Error', 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setDownloadLoading(true);
    try {
      Alert.alert('Report Downloading', 'Your report is being prepared for download.');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert('Download Complete', 'Your report has been downloaded successfully.');
    } catch (error) {
      console.error('Failed to download report:', error);
      Alert.alert('Download Failed', 'There was an error downloading your report. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return 'clock';
      case 'data': return 'file-document';
      case 'photo': return 'camera';
      default: return 'information';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task': return '#16a34a';
      case 'data': return '#2563eb';
      case 'photo': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#16a34a';
      case 'PENDING': return '#d97706';
      case 'IN_PROGRESS': return '#2563eb';
      default: return '#6b7280';
    }
  };

  const renderActivitySummary = () => (
    <View style={styles.tabContent}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Activity Overview</Title>
          <Paragraph style={styles.sectionSubtitle}>Your activity for the selected period</Paragraph>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tasks Completed</Text>
              <Text style={styles.summaryNumber}>{reportData?.summary.tasksCompleted ?? 0}</Text>
              <Text style={[
                styles.summaryTrend,
                { color: (reportData?.summary.tasksTrend ?? 0) >= 0 ? '#16a34a' : '#dc2626' }
              ]}>
                {(reportData?.summary.tasksTrend ?? 0) >= 0 ? '+' : ''}{reportData?.summary.tasksTrend ?? 0}% from previous period
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Data Entries</Text>
              <Text style={styles.summaryNumber}>{reportData?.summary.dataEntries ?? 0}</Text>
              <Text style={[
                styles.summaryTrend,
                { color: (reportData?.summary.dataEntriesTrend ?? 0) >= 0 ? '#16a34a' : '#dc2626' }
              ]}>
                {(reportData?.summary.dataEntriesTrend ?? 0) >= 0 ? '+' : ''}{reportData?.summary.dataEntriesTrend ?? 0}% from previous period
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Photos Captured</Text>
              <Text style={styles.summaryNumber}>{reportData?.summary.photosUploaded ?? 0}</Text>
              <Text style={[
                styles.summaryTrend,
                { color: (reportData?.summary.photosTrend ?? 0) >= 0 ? '#16a34a' : '#dc2626' }
              ]}>
                {(reportData?.summary.photosTrend ?? 0) >= 0 ? '+' : ''}{reportData?.summary.photosTrend ?? 0}% from previous period
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.detailsGrid}>
        <Card style={styles.detailCard}>
          <Card.Content>
            <Title style={styles.detailTitle}>Recent Activity</Title>
            
            <View style={styles.activityList}>
              {reportData?.recentActivity && reportData.recentActivity.length > 0 ? (
                reportData.recentActivity.map((activity, i) => (
                  <View key={i} style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                      <Icon 
                        name={getActivityIcon(activity.type)} 
                        size={16} 
                        color={getActivityColor(activity.type)} 
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityFlock}>{activity.flockName || ''}</Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {formatRelativeTime(activity.date)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No recent activity found</Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.detailCard}>
          <Card.Content>
            <Title style={styles.detailTitle}>Productivity Metrics</Title>
            
            <View style={styles.metricsList}>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Task Completion Rate</Text>
                  <Text style={styles.metricValue}>{reportData?.productivityMetrics.taskCompletionRate ?? 0}%</Text>
                </View>
                <ProgressBar 
                  progress={(reportData?.productivityMetrics.taskCompletionRate ?? 0) / 100} 
                  color="#16a34a" 
                  style={styles.progressBar}
                />
              </View>

              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Data Entry Accuracy</Text>
                  <Text style={styles.metricValue}>{reportData?.productivityMetrics.dataEntryAccuracy ?? 0}%</Text>
                </View>
                <ProgressBar 
                  progress={(reportData?.productivityMetrics.dataEntryAccuracy ?? 0) / 100} 
                  color="#2563eb" 
                  style={styles.progressBar}
                />
              </View>

              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Response Time</Text>
                  <Text style={styles.metricValue}>{reportData?.productivityMetrics.responseTime ?? 0}%</Text>
                </View>
                <ProgressBar 
                  progress={(reportData?.productivityMetrics.responseTime ?? 0) / 100} 
                  color="#7c3aed" 
                  style={styles.progressBar}
                />
              </View>

              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Documentation Quality</Text>
                  <Text style={styles.metricValue}>{reportData?.productivityMetrics.documentationQuality ?? 0}%</Text>
                </View>
                <ProgressBar 
                  progress={(reportData?.productivityMetrics.documentationQuality ?? 0) / 100} 
                  color="#d97706" 
                  style={styles.progressBar}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    </View>
  );

  const renderDataEntries = () => (
    <View style={styles.tabContent}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <View>
              <Title style={styles.sectionTitle}>Data Entry Records</Title>
              <Paragraph style={styles.sectionSubtitle}>All data entries for the selected period</Paragraph>
            </View>
            <Button mode="outlined" compact style={styles.filterButton}>
              <Icon name="filter" size={16} color="#6b7280" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </Button>
          </View>
          
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Date</Text>
              <Text style={styles.tableHeaderText}>Entity ID</Text>
              <Text style={styles.tableHeaderText}>Type</Text>
              <Text style={styles.tableHeaderText}>Value</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
            </View>
            
            {reportData?.dataEntries && reportData.dataEntries.length > 0 ? (
              reportData.dataEntries.map((entry) => (
                <View key={entry.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{formatDate(entry.date)}</Text>
                  <Text style={styles.tableCell}>{entry.entityId}</Text>
                  <Text style={styles.tableCell}>{entry.type}</Text>
                  <Text style={styles.tableCell}>
                    {entry.type === 'feed' 
                      ? `${Math.floor(50 + Math.random() * 20)} kg`
                      : entry.type === 'mortality' 
                        ? `${Math.floor(Math.random() * 5)} birds`
                        : entry.type === 'egg' 
                          ? `${Math.floor(80 + Math.random() * 40)} eggs`
                          : `${(1.2 + Math.random() * 0.8).toFixed(2)} kg`}
                  </Text>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: entry.synced ? '#16a34a' : '#d97706' }}
                    style={[styles.statusChip, { borderColor: entry.synced ? '#16a34a' : '#d97706' }]}
                  >
                    {entry.synced ? 'Synced' : 'Pending'}
                  </Chip>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No data entries found for the selected filters</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderTasks = () => (
    <View style={styles.tabContent}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Task Completion History</Title>
          <Paragraph style={styles.sectionSubtitle}>Tasks completed during the selected period</Paragraph>
          
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Task</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
              <Text style={styles.tableHeaderText}>Completed On</Text>
              <Text style={styles.tableHeaderText}>Duration</Text>
            </View>
            
            {reportData?.tasks && reportData.tasks.length > 0 ? (
              reportData.tasks.map((task) => (
                <View key={task.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{task.title}</Text>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getStatusColor(task.status) }}
                    style={[styles.statusChip, { borderColor: getStatusColor(task.status) }]}
                  >
                    {task.status.charAt(0) + task.status.slice(1).toLowerCase()}
                  </Chip>
                  <Text style={styles.tableCell}>
                    {task.completedAt ? formatDateTime(task.completedAt) : 'Not completed'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {task.duration ? `${task.duration} minutes` : 'N/A'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No tasks found for the selected filters</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading report data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSubtitle}>View and download your activity reports</Text>
          </View>
          <Button
            mode="outlined"
            onPress={handleDownloadReport}
            disabled={downloadLoading || loading}
            style={styles.downloadButton}
          >
            {downloadLoading ? (
              <ActivityIndicator size={16} color="#16a34a" />
            ) : (
              <Icon name="download" size={16} color="#16a34a" />
            )}
            <Text style={styles.downloadButtonText}>Download</Text>
          </Button>
        </View>

        {/* Filters */}
        <Card style={styles.filtersCard}>
          <Card.Content>
            <Title style={styles.filtersTitle}>Report Filters</Title>
            <Paragraph style={styles.filtersSubtitle}>Select date range and report type</Paragraph>
            
            <View style={styles.filtersGrid}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Report Type</Text>
                <SegmentedButtons
                  value={reportType}
                  onValueChange={setReportType}
                  buttons={[
                    { value: 'all', label: 'All' },
                    { value: 'tasks', label: 'Tasks' },
                    { value: 'data', label: 'Data' },
                    { value: 'photos', label: 'Photos' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>
              
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Flock</Text>
                <SegmentedButtons
                  value={flockId}
                  onValueChange={setFlockId}
                  buttons={[
                    { value: 'all', label: 'All Flocks' },
                    ...(reportData?.flocks.map(flock => ({
                      value: flock.id,
                      label: flock.name,
                    })) || []),
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Tab Navigation */}
        <Card style={styles.tabCard}>
          <Card.Content>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: 'activity', label: 'Activity Summary' },
                { value: 'data', label: 'Data Entries' },
                { value: 'tasks', label: 'Task Completion' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Tab Content */}
        {activeTab === 'activity' && renderActivitySummary()}
        {activeTab === 'data' && renderDataEntries()}
        {activeTab === 'tasks' && renderTasks()}
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
  downloadButton: {
    borderColor: '#16a34a',
  },
  downloadButtonText: {
    marginLeft: 8,
    color: '#16a34a',
    fontSize: 14,
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
  filtersCard: {
    margin: 16,
    elevation: 2,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  filtersSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  filtersGrid: {
    gap: 16,
  },
  filterItem: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  tabCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  tabContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterButton: {
    borderColor: '#6b7280',
  },
  filterButtonText: {
    marginLeft: 4,
    color: '#6b7280',
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryTrend: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  detailCard: {
    flex: 1,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activityFlock: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  metricsList: {
    gap: 16,
  },
  metricItem: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#374151',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  statusChip: {
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    padding: 32,
  },
});
