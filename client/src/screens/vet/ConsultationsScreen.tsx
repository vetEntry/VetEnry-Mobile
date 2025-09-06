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

interface Consultation {
  id: string;
  farmerId: string;
  farmerName: string;
  flockId: string;
  flockName: string;
  issue: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
}

export default function ConsultationsScreen() {
  const navigation = useNavigation();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiagnosisDialog, setShowDiagnosisDialog] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all');

  // Diagnosis form state
  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosis: '',
    treatment: '',
    followUpDate: '',
  });

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setIsLoading(true);
      const response = await vetAPI.getConsultations();
      setConsultations(response.consultations || response || []);
    } catch (error) {
      console.error('Error loading consultations:', error);
      Alert.alert('Error', 'Failed to load consultations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConsultation = async (consultationId: string) => {
    try {
      await vetAPI.updateConsultation(consultationId, { status: 'IN_PROGRESS' });
      setConsultations(prev => 
        prev.map(c => c.id === consultationId ? { ...c, status: 'IN_PROGRESS' } : c)
      );
      Alert.alert('Success', 'Consultation started');
    } catch (error) {
      console.error('Error starting consultation:', error);
      Alert.alert('Error', 'Failed to start consultation');
    }
  };

  const handleCompleteConsultation = async (consultationId: string) => {
    try {
      await vetAPI.updateConsultation(consultationId, { status: 'COMPLETED' });
      setConsultations(prev => 
        prev.map(c => c.id === consultationId ? { ...c, status: 'COMPLETED' } : c)
      );
      Alert.alert('Success', 'Consultation completed');
    } catch (error) {
      console.error('Error completing consultation:', error);
      Alert.alert('Error', 'Failed to complete consultation');
    }
  };

  const handleDiagnose = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setDiagnosisForm({
      diagnosis: consultation.diagnosis || '',
      treatment: consultation.treatment || '',
      followUpDate: consultation.followUpDate || '',
    });
    setShowDiagnosisDialog(true);
  };

  const handleSubmitDiagnosis = async () => {
    if (!selectedConsultation || !diagnosisForm.diagnosis || !diagnosisForm.treatment) {
      Alert.alert('Error', 'Please fill in diagnosis and treatment');
      return;
    }

    try {
      await vetAPI.updateConsultation(selectedConsultation.id, {
        diagnosis: diagnosisForm.diagnosis,
        treatment: diagnosisForm.treatment,
        followUpDate: diagnosisForm.followUpDate,
        status: 'COMPLETED',
      });

      setConsultations(prev => 
        prev.map(c => c.id === selectedConsultation.id ? {
          ...c,
          diagnosis: diagnosisForm.diagnosis,
          treatment: diagnosisForm.treatment,
          followUpDate: diagnosisForm.followUpDate,
          status: 'COMPLETED',
        } : c)
      );

      Alert.alert('Success', 'Diagnosis submitted successfully');
      setShowDiagnosisDialog(false);
      setSelectedConsultation(null);
      setDiagnosisForm({ diagnosis: '', treatment: '', followUpDate: '' });
    } catch (error) {
      console.error('Error submitting diagnosis:', error);
      Alert.alert('Error', 'Failed to submit diagnosis');
    }
  };

  const filteredConsultations = consultations.filter(consultation => 
    selectedFilter === 'all' || consultation.status === selectedFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#d97706';
      case 'IN_PROGRESS': return '#2563eb';
      case 'COMPLETED': return '#16a34a';
      case 'CANCELLED': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#16a34a';
      case 'MEDIUM': return '#d97706';
      case 'HIGH': return '#dc2626';
      case 'URGENT': return '#991b1b';
      default: return '#6b7280';
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
        <Title style={styles.headerTitle}>Consultations</Title>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <View style={styles.filterChips}>
            {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((filter) => (
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
                {filter.replace('_', ' ')}
              </Chip>
            ))}
          </View>
        </View>

        {/* Consultations List */}
        {filteredConsultations.map((consultation) => (
          <Card key={consultation.id} style={styles.consultationCard}>
            <Card.Content>
              <View style={styles.consultationHeader}>
                <View style={styles.consultationInfo}>
                  <Title style={styles.consultationTitle}>{consultation.issue}</Title>
                  <Text style={styles.farmerName}>Farmer: {consultation.farmerName}</Text>
                  <Text style={styles.flockName}>Flock: {consultation.flockName}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Chip
                    mode="outlined"
                    style={[styles.statusChip, { borderColor: getStatusColor(consultation.status) }]}
                    textStyle={{ color: getStatusColor(consultation.status) }}
                  >
                    {consultation.status.replace('_', ' ')}
                  </Chip>
                  <Chip
                    mode="outlined"
                    style={[styles.priorityChip, { borderColor: getPriorityColor(consultation.priority) }]}
                    textStyle={{ color: getPriorityColor(consultation.priority) }}
                  >
                    {consultation.priority}
                  </Chip>
                </View>
              </View>

              <Paragraph style={styles.description}>
                {consultation.description}
              </Paragraph>

              {consultation.diagnosis && (
                <View style={styles.diagnosisContainer}>
                  <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
                  <Text style={styles.diagnosisText}>{consultation.diagnosis}</Text>
                </View>
              )}

              {consultation.treatment && (
                <View style={styles.treatmentContainer}>
                  <Text style={styles.treatmentLabel}>Treatment:</Text>
                  <Text style={styles.treatmentText}>{consultation.treatment}</Text>
                </View>
              )}

              <View style={styles.consultationFooter}>
                <Text style={styles.createdAt}>
                  Created: {formatDate(consultation.createdAt)}
                </Text>
                
                <View style={styles.actionButtons}>
                  {consultation.status === 'PENDING' && (
                    <Button
                      mode="contained"
                      onPress={() => handleStartConsultation(consultation.id)}
                      style={styles.actionButton}
                    >
                      Start
                    </Button>
                  )}
                  
                  {consultation.status === 'IN_PROGRESS' && (
                    <Button
                      mode="contained"
                      onPress={() => handleDiagnose(consultation)}
                      style={styles.actionButton}
                    >
                      Diagnose
                    </Button>
                  )}
                  
                  {consultation.status === 'COMPLETED' && (
                    <Button
                      mode="outlined"
                      onPress={() => handleDiagnose(consultation)}
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

      {/* Diagnosis Dialog */}
      <Portal>
        <Dialog visible={showDiagnosisDialog} onDismiss={() => setShowDiagnosisDialog(false)}>
          <Dialog.Title>Diagnosis & Treatment</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Diagnosis"
              value={diagnosisForm.diagnosis}
              onChangeText={(text) => setDiagnosisForm(prev => ({ ...prev, diagnosis: text }))}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Treatment Plan"
              value={diagnosisForm.treatment}
              onChangeText={(text) => setDiagnosisForm(prev => ({ ...prev, treatment: text }))}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Follow-up Date (optional)"
              value={diagnosisForm.followUpDate}
              onChangeText={(text) => setDiagnosisForm(prev => ({ ...prev, followUpDate: text }))}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDiagnosisDialog(false)}>Cancel</Button>
            <Button onPress={handleSubmitDiagnosis}>Submit</Button>
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
  consultationCard: {
    marginBottom: 16,
    elevation: 2,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  consultationInfo: {
    flex: 1,
  },
  consultationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  farmerName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  flockName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  priorityChip: {
    marginBottom: 4,
  },
  description: {
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  diagnosisContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  diagnosisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 5,
  },
  diagnosisText: {
    fontSize: 14,
    color: '#0c4a6e',
  },
  treatmentContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  treatmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 5,
  },
  treatmentText: {
    fontSize: 14,
    color: '#15803d',
  },
  consultationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdAt: {
    fontSize: 12,
    color: '#9ca3af',
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
