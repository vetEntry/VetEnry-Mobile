import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Chip, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface HealthAlert {
  id: string;
  flockName: string;
  farmName: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  reportedDate: string;
  assignedVet?: string;
}

interface Consultation {
  id: string;
  farmName: string;
  farmerName: string;
  issue: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
  duration: number;
  type: 'ON_SITE' | 'REMOTE' | 'EMERGENCY';
}

interface HealthReport {
  id: string;
  flockName: string;
  farmName: string;
  reportType: 'ROUTINE' | 'EMERGENCY' | 'FOLLOW_UP';
  findings: string;
  recommendations: string;
  date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

const mockHealthAlerts: HealthAlert[] = [
  {
    id: '1',
    flockName: 'Broiler Batch A',
    farmName: 'Green Valley Farm',
    issue: 'Unusual mortality rate increase - 5% in 24 hours',
    severity: 'HIGH',
    status: 'PENDING',
    reportedDate: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    flockName: 'Layer Flock B',
    farmName: 'Sunrise Poultry',
    issue: 'Respiratory symptoms in 10% of birds',
    severity: 'MEDIUM',
    status: 'IN_PROGRESS',
    reportedDate: '2024-01-14T16:20:00Z',
    assignedVet: 'Dr. Sarah Kimani',
  },
  {
    id: '3',
    flockName: 'Kienyeji Flock C',
    farmName: 'Organic Farm Ltd',
    issue: 'Feed consumption drop by 20%',
    severity: 'LOW',
    status: 'RESOLVED',
    reportedDate: '2024-01-13T09:15:00Z',
    assignedVet: 'Dr. John Mwangi',
  },
];

const mockConsultations: Consultation[] = [
  {
    id: '1',
    farmName: 'Green Valley Farm',
    farmerName: 'James Kamau',
    issue: 'Broiler health assessment and vaccination schedule',
    status: 'SCHEDULED',
    scheduledDate: '2024-01-16T14:00:00Z',
    duration: 120,
    type: 'ON_SITE',
  },
  {
    id: '2',
    farmName: 'Sunrise Poultry',
    farmerName: 'Mary Wanjiku',
    issue: 'Emergency consultation for respiratory outbreak',
    status: 'IN_PROGRESS',
    scheduledDate: '2024-01-15T11:00:00Z',
    duration: 90,
    type: 'EMERGENCY',
  },
  {
    id: '3',
    farmName: 'Organic Farm Ltd',
    farmerName: 'Peter Mwangi',
    issue: 'Follow-up consultation for feed optimization',
    status: 'COMPLETED',
    scheduledDate: '2024-01-14T10:00:00Z',
    duration: 60,
    type: 'REMOTE',
  },
];

const mockHealthReports: HealthReport[] = [
  {
    id: '1',
    flockName: 'Broiler Batch A',
    farmName: 'Green Valley Farm',
    reportType: 'EMERGENCY',
    findings: 'High mortality rate due to suspected bacterial infection',
    recommendations: 'Immediate antibiotic treatment, isolate affected birds, improve biosecurity',
    date: '2024-01-15T12:00:00Z',
    status: 'SUBMITTED',
  },
  {
    id: '2',
    flockName: 'Layer Flock B',
    farmName: 'Sunrise Poultry',
    reportType: 'ROUTINE',
    findings: 'Overall health good, minor respiratory issues in 5% of birds',
    recommendations: 'Continue current vaccination schedule, monitor respiratory symptoms',
    date: '2024-01-14T15:30:00Z',
    status: 'APPROVED',
  },
];

export default function VetDashboard() {
  const navigation = useNavigation();
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>(mockHealthAlerts);
  const [consultations, setConsultations] = useState<Consultation[]>(mockConsultations);
  const [healthReports, setHealthReports] = useState<HealthReport[]>(mockHealthReports);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#d97706';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'COMPLETED':
      case 'APPROVED': return '#16a34a';
      case 'IN_PROGRESS': return '#2563eb';
      case 'SCHEDULED':
      case 'SUBMITTED': return '#d97706';
      case 'PENDING': return '#d97706';
      case 'CANCELLED': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMERGENCY': return '#dc2626';
      case 'ON_SITE': return '#2563eb';
      case 'REMOTE': return '#16a34a';
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

  const pendingAlerts = healthAlerts.filter(alert => alert.status === 'PENDING').length;
  const activeConsultations = consultations.filter(consultation => 
    consultation.status === 'SCHEDULED' || consultation.status === 'IN_PROGRESS'
  ).length;
  const totalReports = healthReports.length;

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
            <Text style={styles.headerTitle}>Veterinarian Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Monitor health alerts and manage consultations
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Icon name="account-circle" size={32} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="alert-circle" size={32} color="#dc2626" />
              <Text style={styles.statNumber}>{pendingAlerts}</Text>
              <Text style={styles.statLabel}>Pending Alerts</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="calendar-clock" size={32} color="#2563eb" />
              <Text style={styles.statNumber}>{activeConsultations}</Text>
              <Text style={styles.statLabel}>Active Consultations</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="file-document" size={32} color="#16a34a" />
              <Text style={styles.statNumber}>{totalReports}</Text>
              <Text style={styles.statLabel}>Health Reports</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('HealthAlerts' as never)}
          >
            <Icon name="alert-circle" size={24} color="#dc2626" />
            <Text style={styles.quickActionText}>Health Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Consultations' as never)}
          >
            <Icon name="calendar-clock" size={24} color="#2563eb" />
            <Text style={styles.quickActionText}>Consultations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Reports' as never)}
          >
            <Icon name="file-document" size={24} color="#16a34a" />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Critical Health Alerts */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Critical Health Alerts</Title>
              <Text style={styles.alertCount}>{pendingAlerts} pending</Text>
            </View>

            {healthAlerts.filter(alert => alert.severity === 'HIGH' || alert.severity === 'CRITICAL').map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertFlock}>{alert.flockName}</Text>
                  <Text style={styles.alertFarm}>{alert.farmName}</Text>
                  <Text style={styles.alertIssue}>{alert.issue}</Text>
                  <Text style={styles.alertDate}>
                    Reported: {formatDate(alert.reportedDate)}
                  </Text>
                </View>

                <View style={styles.alertStatus}>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getSeverityColor(alert.severity) }}
                    style={[styles.severityChip, { borderColor: getSeverityColor(alert.severity) }]}
                  >
                    {alert.severity}
                  </Chip>
                  
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getStatusColor(alert.status) }}
                    style={[styles.statusChip, { borderColor: getStatusColor(alert.status) }]}
                  >
                    {alert.status}
                  </Chip>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Upcoming Consultations */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Upcoming Consultations</Title>
              <Text style={styles.consultationCount}>{activeConsultations} scheduled</Text>
            </View>

            {consultations.filter(consultation => 
              consultation.status === 'SCHEDULED' || consultation.status === 'IN_PROGRESS'
            ).map((consultation) => (
              <View key={consultation.id} style={styles.consultationItem}>
                <View style={styles.consultationInfo}>
                  <Text style={styles.consultationFarm}>{consultation.farmName}</Text>
                  <Text style={styles.consultationFarmer}>{consultation.farmerName}</Text>
                  <Text style={styles.consultationIssue}>{consultation.issue}</Text>
                  <Text style={styles.consultationTime}>
                    {formatDate(consultation.scheduledDate)} • {consultation.duration} min
                  </Text>
                </View>

                <View style={styles.consultationStatus}>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getTypeColor(consultation.type) }}
                    style={[styles.typeChip, { borderColor: getTypeColor(consultation.type) }]}
                  >
                    {consultation.type.replace('_', ' ')}
                  </Chip>
                  
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getStatusColor(consultation.status) }}
                    style={[styles.statusChip, { borderColor: getStatusColor(consultation.status) }]}
                  >
                    {consultation.status}
                  </Chip>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Recent Health Reports */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Recent Health Reports</Title>
              <Text style={styles.reportCount}>{totalReports} reports</Text>
            </View>

            {healthReports.slice(0, 3).map((report) => (
              <View key={report.id} style={styles.reportItem}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportFlock}>{report.flockName}</Text>
                  <Text style={styles.reportFarm}>{report.farmName}</Text>
                  <Text style={styles.reportType}>{report.reportType.replace('_', ' ')}</Text>
                  <Text style={styles.reportFindings} numberOfLines={2}>
                    {report.findings}
                  </Text>
                  <Text style={styles.reportDate}>
                    {formatDate(report.date)}
                  </Text>
                </View>

                <View style={styles.reportStatus}>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getStatusColor(report.status) }}
                    style={[styles.statusChip, { borderColor: getStatusColor(report.status) }]}
                  >
                    {report.status}
                  </Chip>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Emergency Contacts */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Emergency Contacts</Title>
            
            <View style={styles.contactItem}>
              <Icon name="phone" size={20} color="#dc2626" />
              <View style={styles.contactContent}>
                <Text style={styles.contactText}>Emergency Hotline: +254 700 123 456</Text>
                <Text style={styles.contactNote}>Available 24/7 for critical cases</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Icon name="email" size={20} color="#2563eb" />
              <View style={styles.contactContent}>
                <Text style={styles.contactText}>Emergency Email: emergency@vetcare.com</Text>
                <Text style={styles.contactNote}>Response within 1 hour</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Icon name="map-marker" size={20} color="#16a34a" />
              <View style={styles.contactContent}>
                <Text style={styles.contactText}>Emergency Clinic: VetCare Emergency Center</Text>
                <Text style={styles.contactNote}>Nairobi, 30 min response time</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('NewConsultation' as never)}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  sectionCard: {
    margin: 16,
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
  alertCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  alertInfo: {
    flex: 1,
  },
  alertFlock: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alertFarm: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  alertIssue: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  alertDate: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  alertStatus: {
    alignItems: 'flex-end',
  },
  severityChip: {
    marginBottom: 4,
  },
  statusChip: {
    marginBottom: 4,
  },
  consultationCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  consultationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  consultationInfo: {
    flex: 1,
  },
  consultationFarm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  consultationFarmer: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  consultationIssue: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  consultationTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  consultationStatus: {
    alignItems: 'flex-end',
  },
  typeChip: {
    marginBottom: 4,
  },
  reportCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reportInfo: {
    flex: 1,
  },
  reportFlock: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reportFarm: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  reportType: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  reportFindings: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 16,
  },
  reportDate: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  reportStatus: {
    alignItems: 'flex-end',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  contactNote: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#16a34a',
  },
});
