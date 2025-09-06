import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Chip, FAB, Dialog, Portal, TextInput as PaperTextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { vetAPI } from '../../services/api';

interface HealthAlert {
  id: string;
  flockId: string;
  flockName: string;
  farmerId: string;
  farmerName: string;
  type: 'DISEASE' | 'INJURY' | 'BEHAVIOR' | 'ENVIRONMENT' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
  title: string;
  description: string;
  symptoms: string[];
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  response?: string;
  recommendations?: string[];
}

export default function HealthAlertsScreen() {
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<HealthAlert | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'PENDING' | 'INVESTIGATING' | 'RESOLVED'>('all');

  // Response form state
  const [responseForm, setResponseForm] = useState({
    response: '',
    recommendations: '',
    status: 'RESOLVED' as 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED',
  });

  useEffect(() => {
    loadHealthAlerts();
  }, []);

  const loadHealthAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await vetAPI.getHealthAlerts();
      setAlerts(response.alerts || response || []);
    } catch (error) {
      console.error('Error loading health alerts:', error);
      Alert.alert('Error', 'Failed to load health alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToAlert = async (alertId: string) => {
    try {
      await vetAPI.respondToHealthAlert(alertId, {
        response: responseForm.response,
        recommendations: responseForm.recommendations.split(',').map(r => r.trim()).filter(r => r),
        status: responseForm.status,
      });

      setAlerts(prev => 
        prev.map(a => a.id === alertId ? {
          ...a,
          response: responseForm.response,
          recommendations: responseForm.recommendations.split(',').map(r => r.trim()).filter(r => r),
          status: responseForm.status,
          resolvedAt: responseForm.status === 'RESOLVED' ? new Date().toISOString() : undefined,
        } : a)
      );

      Alert.alert('Success', 'Response submitted successfully');
      setShowResponseDialog(false);
      setSelectedAlert(null);
      setResponseForm({ response: '', recommendations: '', status: 'RESOLVED' });
    } catch (error) {
      console.error('Error responding to alert:', error);
      Alert.alert('Error', 'Failed to submit response');
    }
  };

  const handleRespond = (alert: HealthAlert) => {
    setSelectedAlert(alert);
    setResponseForm({
      response: alert.response || '',
      recommendations: alert.recommendations?.join(', ') || '',
      status: alert.status === 'PENDING' ? 'INVESTIGATING' : alert.status,
    });
    setShowResponseDialog(true);
  };

  const filteredAlerts = alerts.filter(alert => 
    selectedFilter === 'all' || alert.status === selectedFilter
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#16a34a';
      case 'MEDIUM': return '#d97706';
      case 'HIGH': return '#dc2626';
      case 'CRITICAL': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#d97706';
      case 'INVESTIGATING': return '#2563eb';
      case 'RESOLVED': return '#16a34a';
      case 'ESCALATED': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DISEASE': return 'virus';
      case 'INJURY': return 'bandage';
      case 'BEHAVIOR': return 'eye';
      case 'ENVIRONMENT': return 'thermometer';
      default: return 'alert-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Health Alerts</Title>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <View style={styles.filterChips}>
            {['all', 'PENDING', 'INVESTIGATING', 'RESOLVED'].map((filter) => (
              <Chip
                key={filter}
                mode={selectedFilter === filter ? 'flat' : 'outlined'}
                selected={selectedFilter === filter}
                onPress={() => setSelectedFilter(filter as any)}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && { backgroundColor: getStatusColor(filter) }
                ]}
                textStyle={{
                  color: selectedFilter === filter ? 'white' : getStatusColor(filter)
                }}
              >
                {filter}
              </Chip>
            ))}
          </View>
        </View>

        {/* Alerts List */}
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} style={styles.alertCard}>
            <Card.Content>
              <View style={styles.alertHeader}>
                <View style={styles.alertInfo}>
                  <View style={styles.alertTitleRow}>
                    <Icon 
                      name={getTypeIcon(alert.type)} 
                      size={20} 
                      color={getSeverityColor(alert.severity)} 
                    />
                    <Title style={styles.alertTitle}>{alert.title}</Title>
                  </View>
                  <Text style={styles.flockName}>Flock: {alert.flockName}</Text>
                  <Text style={styles.farmerName}>Farmer: {alert.farmerName}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Chip
                    mode="outlined"
                    style={[styles.severityChip, { borderColor: getSeverityColor(alert.severity) }]}
                    textStyle={{ color: getSeverityColor(alert.severity) }}
                  >
                    {alert.severity}
                  </Chip>
                  <Chip
                    mode="outlined"
                    style={[styles.statusChip, { borderColor: getStatusColor(alert.status) }]}
                    textStyle={{ color: getStatusColor(alert.status) }}
                  >
                    {alert.status}
                  </Chip>
                </View>
              </View>

              <Paragraph style={styles.description}>
                {alert.description}
              </Paragraph>

              {alert.symptoms.length > 0 && (
                <View style={styles.symptomsContainer}>
                  <Text style={styles.symptomsLabel}>Symptoms:</Text>
                  <View style={styles.symptomsList}>
                    {alert.symptoms.map((symptom, index) => (
                      <Chip key={index} mode="outlined" style={styles.symptomChip}>
                        {symptom}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}

              {alert.response && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Veterinary Response:</Text>
                  <Text style={styles.responseText}>{alert.response}</Text>
                </View>
              )}

              {alert.recommendations && alert.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsLabel}>Recommendations:</Text>
                  <View style={styles.recommendationsList}>
                    {alert.recommendations.map((recommendation, index) => (
                      <Chip key={index} mode="outlined" style={styles.recommendationChip}>
                        {recommendation}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.alertFooter}>
                <View style={styles.alertMeta}>
                  <Text style={styles.reportedBy}>
                    Reported by: {alert.reportedBy}
                  </Text>
                  <Text style={styles.reportedAt}>
                    {formatDate(alert.reportedAt)}
                  </Text>
                  {alert.resolvedAt && (
                    <Text style={styles.resolvedAt}>
                      Resolved: {formatDate(alert.resolvedAt)}
                    </Text>
                  )}
                </View>
                
                <View style={styles.actionButtons}>
                  {alert.status === 'PENDING' && (
                    <Button
                      mode="contained"
                      onPress={() => handleRespond(alert)}
                      style={styles.actionButton}
                    >
                      Respond
                    </Button>
                  )}
                  
                  {alert.status === 'INVESTIGATING' && (
                    <Button
                      mode="contained"
                      onPress={() => handleRespond(alert)}
                      style={styles.actionButton}
                    >
                      Update
                    </Button>
                  )}
                  
                  {alert.status === 'RESOLVED' && (
                    <Button
                      mode="outlined"
                      onPress={() => handleRespond(alert)}
                      style={styles.actionButton}
                    >
                      View Details
                    </Button>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Response Dialog */}
      <Portal>
        <Dialog visible={showResponseDialog} onDismiss={() => setShowResponseDialog(false)}>
          <Dialog.Title>Respond to Health Alert</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Response"
              value={responseForm.response}
              onChangeText={(text) => setResponseForm(prev => ({ ...prev, response: text }))}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Recommendations (comma-separated)"
              value={responseForm.recommendations}
              onChangeText={(text) => setResponseForm(prev => ({ ...prev, recommendations: text }))}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResponseDialog(false)}>Cancel</Button>
            <Button onPress={() => handleRespondToAlert(selectedAlert?.id || '')}>Submit</Button>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  alertCard: {
    marginBottom: 16,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  flockName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  farmerName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  severityChip: {
    marginBottom: 4,
  },
  statusChip: {
    marginBottom: 4,
  },
  description: {
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  symptomsContainer: {
    marginBottom: 15,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomChip: {
    marginRight: 6,
    marginBottom: 6,
  },
  responseContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 5,
  },
  responseText: {
    fontSize: 14,
    color: '#0c4a6e',
  },
  recommendationsContainer: {
    marginBottom: 15,
  },
  recommendationsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  recommendationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recommendationChip: {
    marginRight: 6,
    marginBottom: 6,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  alertMeta: {
    flex: 1,
  },
  reportedBy: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  reportedAt: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  resolvedAt: {
    fontSize: 12,
    color: '#16a34a',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  dialogInput: {
    marginBottom: 16,
  },
});
