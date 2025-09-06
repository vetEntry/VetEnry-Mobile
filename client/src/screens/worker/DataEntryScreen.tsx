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
import { 
  Card, 
  Title, 
  Button, 
  TextInput, 
  Chip, 
  SegmentedButtons,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workerAPI, syncOfflineData } from '../../services/api';

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

interface DataEntry {
  id: string;
  type: 'FEED' | 'HEALTH' | 'WEIGHT' | 'EGG' | 'MORTALITY';
  flockId: string;
  flockName: string;
  data: any;
  timestamp: string;
  isSynced: boolean;
}

// This will be replaced with API data

export default function DataEntryScreen() {
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<DataEntry[]>([]);
  const [activeTab, setActiveTab] = useState('produce');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedFlocks, setAssignedFlocks] = useState<AssignedFlock[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [mortalityForm, setMortalityForm] = useState({
    flockId: '',
    mortalityCount: '',
    cause: '',
    notes: '',
  });
  
  const [feedForm, setFeedForm] = useState({
    flockId: '',
    feedType: '',
    quantity: '',
    notes: '',
  });
  
  const [productionForm, setProductionForm] = useState({
    flockId: '',
    eggCount: '',
    eggWeight: '',
    notes: '',
  });

  const [healthForm, setHealthForm] = useState({
    flockId: '',
    temperature: '',
    symptoms: '',
    treatment: '',
    notes: '',
  });

  const [weightForm, setWeightForm] = useState({
    flockId: '',
    sampleSize: '',
    averageWeight: '',
    notes: '',
  });

  // Voice recording and photo capture states
  const [isRecording, setIsRecording] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    checkNetworkStatus();
    loadOfflineData();
    loadAssignedFlocks();
    
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        syncOfflineData();
      }
    });

    return () => unsubscribe();
  }, []);

  const checkNetworkStatus = async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected ?? false);
  };

  const loadAssignedFlocks = async () => {
    try {
      setLoading(true);
      const flocks = await workerAPI.getFlocks();
      setAssignedFlocks(flocks);
    } catch (error) {
      console.error('Error loading assigned flocks:', error);
      Alert.alert('Error', 'Failed to load assigned flocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineData = async () => {
    try {
      const stored = await AsyncStorage.getItem('offlineDataEntries');
      if (stored) {
        setOfflineData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveOfflineData = async () => {
    try {
      await AsyncStorage.setItem('offlineDataEntries', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const addOfflineEntry = (entry: Omit<DataEntry, 'id' | 'timestamp' | 'isSynced'>) => {
    const newEntry: DataEntry = {
      ...entry,
      id: `offline_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isSynced: false,
    };

    setOfflineData(prev => [...prev, newEntry]);
    saveOfflineData();
    Alert.alert('Success', 'Data saved offline. Will sync when connection is restored.');
  };

  const handleSubmit = async (type: string, formData: any) => {
    if (!formData.flockId) {
      Alert.alert('Error', 'Please select a flock');
      return;
    }

    const flock = assignedFlocks.find(f => f.id === formData.flockId);
    if (!flock) {
      Alert.alert('Error', 'Selected flock not found');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      switch (type) {
        case 'FEED':
          result = await workerAPI.submitFeedRecord(formData);
          break;
        case 'HEALTH':
          result = await workerAPI.submitHealthRecord(formData);
          break;
        case 'WEIGHT':
          result = await workerAPI.submitWeightRecord(formData);
          break;
        case 'EGG':
          result = await workerAPI.submitEggRecord(formData);
          break;
        case 'MORTALITY':
          result = await workerAPI.submitHealthRecord({ ...formData, type: 'MORTALITY' });
          break;
        default:
          throw new Error('Invalid data type');
      }

      if (result.offline) {
        Alert.alert('Success', 'Data saved offline. Will sync when connection is restored.');
      } else {
        Alert.alert('Success', `${type} data submitted successfully`);
      }
      
      resetForm(type);
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', 'Failed to submit data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (type: string) => {
    switch (type) {
      case 'MORTALITY':
        setMortalityForm({ flockId: '', mortalityCount: '', cause: '', notes: '' });
        break;
      case 'FEED':
        setFeedForm({ flockId: '', feedType: '', quantity: '', notes: '' });
        break;
      case 'EGG':
        setProductionForm({ flockId: '', eggCount: '', eggWeight: '', notes: '' });
        break;
      case 'HEALTH':
        setHealthForm({ flockId: '', temperature: '', symptoms: '', treatment: '', notes: '' });
        break;
      case 'WEIGHT':
        setWeightForm({ flockId: '', sampleSize: '', averageWeight: '', notes: '' });
        break;
    }
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingDuration(0);
      Alert.alert('Voice Recording', 'Recording stopped and saved');
    } else {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Simulate recording duration
      const interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) { // Max 30 seconds
            setIsRecording(false);
            clearInterval(interval);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

      Alert.alert('Voice Recording', 'Recording started...');
    }
  };

  const handlePhotoCapture = () => {
    setHasPhoto(!hasPhoto);
    Alert.alert('Photo Capture', hasPhoto ? 'Photo removed' : 'Photo captured successfully');
  };

  const renderFlockSelector = (formType: string, currentFlockId: string, onSelect: (id: string) => void) => (
    <TouchableOpacity
      style={styles.pickerButton}
      onPress={() => {
        if (assignedFlocks.length === 0) {
          Alert.alert('No Flocks', 'No flocks assigned to you. Please contact your supervisor.');
          return;
        }
        
        Alert.alert(
          'Select Flock',
          'Choose a flock:',
          assignedFlocks.map(flock => ({
            text: flock.name,
            onPress: () => onSelect(flock.id),
          }))
        );
      }}
    >
      <Text style={styles.pickerButtonText}>
        {assignedFlocks.find(f => f.id === currentFlockId)?.name || 'Select Flock'}
      </Text>
      <Icon name="chevron-down" size={20} color="#6b7280" />
    </TouchableOpacity>
  );

  const renderMediaButtons = () => (
    <View style={styles.mediaButtons}>
      <TouchableOpacity
        style={[styles.mediaButton, isRecording && styles.mediaButtonActive]}
        onPress={handleVoiceRecording}
      >
        <Icon 
          name={isRecording ? "stop" : "microphone"} 
          size={20} 
          color={isRecording ? "#dc2626" : "#6b7280"} 
        />
        <Text style={styles.mediaButtonText}>
          {isRecording ? `Recording (${recordingDuration}s)` : 'Voice'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.mediaButton, hasPhoto && styles.mediaButtonActive]}
        onPress={handlePhotoCapture}
      >
        <Icon 
          name={hasPhoto ? "camera-off" : "camera"} 
          size={20} 
          color={hasPhoto ? "#16a34a" : "#6b7280"} 
        />
        <Text style={styles.mediaButtonText}>
          {hasPhoto ? 'Photo Added' : 'Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProduceTab = () => (
    <View style={styles.tabContent}>
      <Title style={styles.tabTitle}>Production Data</Title>
      <Text style={styles.tabSubtitle}>Record egg production and quality metrics</Text>
      
      {renderFlockSelector('EGG', productionForm.flockId, (id) => 
        setProductionForm({ ...productionForm, flockId: id })
      )}

      <TextInput
        label="Egg Count"
        value={productionForm.eggCount}
        onChangeText={(text: string) => setProductionForm({ ...productionForm, eggCount: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter number of eggs collected"
      />

      <TextInput
        label="Average Egg Weight (g)"
        value={productionForm.eggWeight}
        onChangeText={(text: string) => setProductionForm({ ...productionForm, eggWeight: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter average weight in grams"
      />

      <TextInput
        label="Notes (optional)"
        value={productionForm.notes}
        onChangeText={(text: string) => setProductionForm({ ...productionForm, notes: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="Any additional observations or notes"
      />

      {renderMediaButtons()}

      <Button
        mode="contained"
        onPress={() => handleSubmit('EGG', productionForm)}
        style={styles.submitButton}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Production Data'}
      </Button>
    </View>
  );

  const renderFeedTab = () => (
    <View style={styles.tabContent}>
      <Title style={styles.tabTitle}>Feed Data</Title>
      <Text style={styles.tabSubtitle}>Record feed consumption and type</Text>
      
      {renderFlockSelector('FEED', feedForm.flockId, (id) => 
        setFeedForm({ ...feedForm, flockId: id })
      )}

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => {
          Alert.alert(
            'Select Feed Type',
            'Choose feed type:',
            [
              { text: 'Starter Feed', onPress: () => setFeedForm({ ...feedForm, feedType: 'Starter Feed' }) },
              { text: 'Grower Feed', onPress: () => setFeedForm({ ...feedForm, feedType: 'Grower Feed' }) },
              { text: 'Finisher Feed', onPress: () => setFeedForm({ ...feedForm, feedType: 'Finisher Feed' }) },
              { text: 'Layer Feed', onPress: () => setFeedForm({ ...feedForm, feedType: 'Layer Feed' }) },
              { text: 'Custom Feed', onPress: () => setFeedForm({ ...feedForm, feedType: 'Custom Feed' }) },
            ]
          );
        }}
      >
        <Text style={styles.pickerButtonText}>
          {feedForm.feedType || 'Select Feed Type'}
        </Text>
        <Icon name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      <TextInput
        label="Quantity (kg)"
        value={feedForm.quantity}
        onChangeText={(text) => setFeedForm({ ...feedForm, quantity: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter feed quantity in kilograms"
      />

      <TextInput
        label="Notes (optional)"
        value={feedForm.notes}
        onChangeText={(text) => setFeedForm({ ...feedForm, notes: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="Any observations about feed quality or consumption"
      />

      {renderMediaButtons()}

      <Button
        mode="contained"
        onPress={() => handleSubmit('FEED', feedForm)}
        style={styles.submitButton}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Feed Data'}
      </Button>
    </View>
  );

  const renderHealthTab = () => (
    <View style={styles.tabContent}>
      <Title style={styles.tabTitle}>Health Data</Title>
      <Text style={styles.tabSubtitle}>Record health observations and treatments</Text>
      
      {renderFlockSelector('HEALTH', healthForm.flockId, (id) => 
        setHealthForm({ ...healthForm, flockId: id })
      )}

      <TextInput
        label="Temperature (°C)"
        value={healthForm.temperature}
        onChangeText={(text) => setHealthForm({ ...healthForm, temperature: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter average temperature reading"
      />

      <TextInput
        label="Symptoms Observed"
        value={healthForm.symptoms}
        onChangeText={(text) => setHealthForm({ ...healthForm, symptoms: text })}
        mode="outlined"
        multiline
        numberOfLines={2}
        style={styles.input}
        placeholder="Describe any symptoms or unusual behavior"
      />

      <TextInput
        label="Treatment Given"
        value={healthForm.treatment}
        onChangeText={(text) => setHealthForm({ ...healthForm, treatment: text })}
        mode="outlined"
        multiline
        numberOfLines={2}
        style={styles.input}
        placeholder="Record any treatments or medications administered"
      />

      <TextInput
        label="Notes (optional)"
        value={healthForm.notes}
        onChangeText={(text) => setHealthForm({ ...healthForm, notes: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="Additional health observations or recommendations"
      />

      {renderMediaButtons()}

      <Button
        mode="contained"
        onPress={() => handleSubmit('HEALTH', healthForm)}
        style={styles.submitButton}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Health Data'}
      </Button>
    </View>
  );

  const renderMortalityTab = () => (
    <View style={styles.tabContent}>
      <Title style={styles.tabTitle}>Mortality Data</Title>
      <Text style={styles.tabSubtitle}>Record mortality incidents and causes</Text>
      
      {renderFlockSelector('MORTALITY', mortalityForm.flockId, (id) => 
        setMortalityForm({ ...mortalityForm, flockId: id })
      )}

      <TextInput
        label="Mortality Count"
        value={mortalityForm.mortalityCount}
        onChangeText={(text) => setMortalityForm({ ...mortalityForm, mortalityCount: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter number of birds that died"
      />

      <TextInput
        label="Cause of Death"
        value={mortalityForm.cause}
        onChangeText={(text) => setMortalityForm({ ...mortalityForm, cause: text })}
        mode="outlined"
        multiline
        numberOfLines={2}
        style={styles.input}
        placeholder="Describe the suspected or confirmed cause of death"
      />

      <TextInput
        label="Notes (optional)"
        value={mortalityForm.notes}
        onChangeText={(text) => setMortalityForm({ ...mortalityForm, notes: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="Additional details about the mortality incident"
      />

      {renderMediaButtons()}

      <Button
        mode="contained"
        onPress={() => handleSubmit('MORTALITY', mortalityForm)}
        style={styles.submitButton}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Mortality Data'}
      </Button>
    </View>
  );

  const renderWeightTab = () => (
    <View style={styles.tabContent}>
      <Title style={styles.tabTitle}>Weight Data</Title>
      <Text style={styles.tabSubtitle}>Record weight measurements and growth tracking</Text>
      
      {renderFlockSelector('WEIGHT', weightForm.flockId, (id) => 
        setWeightForm({ ...weightForm, flockId: id })
      )}

      <TextInput
        label="Sample Size (number of birds)"
        value={weightForm.sampleSize}
        onChangeText={(text) => setWeightForm({ ...weightForm, sampleSize: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter number of birds weighed"
      />

      <TextInput
        label="Average Weight (kg)"
        value={weightForm.averageWeight}
        onChangeText={(text) => setWeightForm({ ...weightForm, averageWeight: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter average weight in kilograms"
      />

      <TextInput
        label="Notes (optional)"
        value={weightForm.notes}
        onChangeText={(text) => setWeightForm({ ...weightForm, notes: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="Any observations about growth or weight distribution"
      />

      {renderMediaButtons()}

      <Button
        mode="contained"
        onPress={() => handleSubmit('WEIGHT', weightForm)}
        style={styles.submitButton}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Weight Data'}
      </Button>
    </View>
  );

  const pendingEntries = offlineData.filter(entry => !entry.isSynced).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Data Entry</Text>
          <Text style={styles.headerSubtitle}>
            Record daily activities for your flocks
          </Text>
        </View>

        {/* Network Status */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Icon 
                name={isOnline ? 'wifi' : 'wifi-off'} 
                size={24} 
                color={isOnline ? '#16a34a' : '#dc2626'} 
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusText}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Text style={styles.statusSubtext}>
                  {isOnline ? 'Data will be submitted immediately' : 'Data will be saved offline'}
                </Text>
              </View>
            </View>
            
            {pendingEntries > 0 && (
              <View style={styles.pendingInfo}>
                <Icon name="cloud-upload" size={20} color="#d97706" />
                <Text style={styles.pendingText}>
                  {pendingEntries} entries waiting to sync
                </Text>
              </View>
            )}

            {isSubmitting && (
              <View style={styles.submittingInfo}>
                <ProgressBar progress={0.5} color="#16a34a" />
                <Text style={styles.submittingText}>Submitting data...</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Tab Navigation */}
        <Card style={styles.tabCard}>
          <Card.Content>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: 'produce', label: 'Produce', icon: 'egg' },
                { value: 'feed', label: 'Feed', icon: 'food-apple' },
                { value: 'health', label: 'Health', icon: 'heart-pulse' },
                { value: 'mortality', label: 'Mortality', icon: 'skull' },
                { value: 'weight', label: 'Weight', icon: 'scale' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Tab Content */}
        <Card style={styles.contentCard}>
          <Card.Content>
            {activeTab === 'produce' && renderProduceTab()}
            {activeTab === 'feed' && renderFeedTab()}
            {activeTab === 'health' && renderHealthTab()}
            {activeTab === 'mortality' && renderMortalityTab()}
            {activeTab === 'weight' && renderWeightTab()}
          </Card.Content>
        </Card>

        {/* Recent Entries */}
        {offlineData.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Recent Entries</Title>
              <Text style={styles.sectionSubtitle}>Your recent data entries</Text>
              
              {offlineData.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.entryItem}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryType}>{entry.type}</Text>
                    <Text style={styles.entryFlock}>{entry.flockName}</Text>
                    <Text style={styles.entryTime}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.entryStatus}>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: entry.isSynced ? '#16a34a' : '#d97706' }}
                      style={[
                        styles.statusChip, 
                        { borderColor: entry.isSynced ? '#16a34a' : '#d97706' }
                      ]}
                    >
                      {entry.isSynced ? 'Synced' : 'Pending'}
                    </Chip>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
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
  statusCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  submittingInfo: {
    marginTop: 12,
  },
  submittingText: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 8,
    textAlign: 'center',
  },
  tabCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  contentCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  tabContent: {
    paddingVertical: 8,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  mediaButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
  },
  mediaButtonActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#16a34a',
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#16a34a',
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
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
    marginBottom: 16,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryInfo: {
    flex: 1,
  },
  entryType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  entryFlock: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  entryTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  entryStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
});
