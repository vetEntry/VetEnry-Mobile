import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Button, TextInput, Chip, Dialog, Portal, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  assignedFlocks: number;
  lastActive: string;
  avatar?: string;
}

const mockWorkers: Worker[] = [
  {
    id: '1',
    name: 'John Kamau',
    email: 'john.kamau@farm.com',
    phone: '+254700123456',
    role: 'Farm Worker',
    status: 'ACTIVE',
    assignedFlocks: 3,
    lastActive: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Mary Wanjiku',
    email: 'mary.wanjiku@farm.com',
    phone: '+254700123457',
    role: 'Supervisor',
    status: 'ACTIVE',
    assignedFlocks: 5,
    lastActive: '2024-01-15T09:15:00Z',
  },
  {
    id: '3',
    name: 'Peter Mwangi',
    email: 'peter.mwangi@farm.com',
    phone: '+254700123458',
    role: 'Farm Worker',
    status: 'PENDING',
    assignedFlocks: 0,
    lastActive: '2024-01-14T16:45:00Z',
  },
];

export default function WorkerManagementScreen() {
  const navigation = useNavigation();
  const [workers, setWorkers] = useState<Worker[]>(mockWorkers);
  const [showAddWorkerDialog, setShowAddWorkerDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Form states
  const [workerForm, setWorkerForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Farm Worker',
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'Farm Worker',
    message: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#16a34a';
      case 'INACTIVE': return '#dc2626';
      case 'PENDING': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'INACTIVE': return 'Inactive';
      case 'PENDING': return 'Pending';
      default: return 'Unknown';
    }
  };

  const handleAddWorker = () => {
    if (!workerForm.name || !workerForm.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newWorker: Worker = {
      id: `worker_${Date.now()}`,
      name: workerForm.name,
      email: workerForm.email,
      phone: workerForm.phone,
      role: workerForm.role,
      status: 'PENDING',
      assignedFlocks: 0,
      lastActive: new Date().toISOString(),
    };

    setWorkers(prev => [...prev, newWorker]);
    setShowAddWorkerDialog(false);
    resetWorkerForm();
    Alert.alert('Success', 'Worker added successfully');
  };

  const handleInviteWorker = () => {
    if (!inviteForm.email) {
      Alert.alert('Error', 'Please enter email address');
      return;
    }

    Alert.alert('Success', `Invitation sent to ${inviteForm.email}`);
    setShowInviteDialog(false);
    resetInviteForm();
  };

  const handleWorkerAction = (worker: Worker, action: string) => {
    switch (action) {
      case 'activate':
        setWorkers(prev => prev.map(w => 
          w.id === worker.id ? { ...w, status: 'ACTIVE' as any } : w
        ));
        Alert.alert('Success', `${worker.name} activated successfully`);
        break;
      case 'deactivate':
        setWorkers(prev => prev.map(w => 
          w.id === worker.id ? { ...w, status: 'INACTIVE' as any } : w
        ));
        Alert.alert('Success', `${worker.name} deactivated successfully`);
        break;
      case 'remove':
        Alert.alert(
          'Confirm Removal',
          `Are you sure you want to remove ${worker.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                setWorkers(prev => prev.filter(w => w.id !== worker.id));
                Alert.alert('Success', `${worker.name} removed successfully`);
              },
            },
          ]
        );
        break;
    }
  };

  const resetWorkerForm = () => {
    setWorkerForm({
      name: '',
      email: '',
      phone: '',
      role: 'Farm Worker',
    });
  };

  const resetInviteForm = () => {
    setInviteForm({
      email: '',
      role: 'Farm Worker',
      message: '',
    });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.ceil(diffHours / 24)} days ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Worker Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage your farm workers and their assignments
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowAddWorkerDialog(true)}
          >
            <Icon name="account-plus" size={24} color="#16a34a" />
            <Text style={styles.quickActionText}>Add Worker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowInviteDialog(true)}
          >
            <Icon name="email-send" size={24} color="#2563eb" />
            <Text style={styles.quickActionText}>Invite Worker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Coming Soon', 'Bulk operations will be available soon')}
          >
            <Icon name="account-multiple" size={24} color="#d97706" />
            <Text style={styles.quickActionText}>Bulk Operations</Text>
          </TouchableOpacity>
        </View>

        {/* Worker Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="account-group" size={32} color="#16a34a" />
              <Text style={styles.statNumber}>{workers.length}</Text>
              <Text style={styles.statLabel}>Total Workers</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="check-circle" size={32} color="#2563eb" />
              <Text style={styles.statNumber}>
                {workers.filter(w => w.status === 'ACTIVE').length}
              </Text>
              <Text style={styles.statLabel}>Active Workers</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="clock" size={32} color="#d97706" />
              <Text style={styles.statNumber}>
                {workers.filter(w => w.status === 'PENDING').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Workers List */}
        <Card style={styles.workersCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Farm Workers</Title>
              <Text style={styles.workerCount}>{workers.length} workers</Text>
            </View>

            {workers.map((worker) => (
              <View key={worker.id} style={styles.workerItem}>
                <View style={styles.workerInfo}>
                  <Avatar.Text 
                    size={48} 
                    label={worker.name.split(' ').map(n => n[0]).join('')}
                    style={styles.workerAvatar}
                  />
                  
                  <View style={styles.workerDetails}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerRole}>{worker.role}</Text>
                    <Text style={styles.workerContact}>{worker.email}</Text>
                    <Text style={styles.workerContact}>{worker.phone}</Text>
                  </View>
                </View>

                <View style={styles.workerStatus}>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getStatusColor(worker.status) }}
                    style={[styles.statusChip, { borderColor: getStatusColor(worker.status) }]}
                  >
                    {getStatusText(worker.status)}
                  </Chip>
                  
                  <Text style={styles.assignedFlocks}>
                    {worker.assignedFlocks} flocks assigned
                  </Text>
                  
                  <Text style={styles.lastActive}>
                    Last active: {formatLastActive(worker.lastActive)}
                  </Text>
                </View>

                <View style={styles.workerActions}>
                  {worker.status === 'PENDING' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.activateButton]}
                      onPress={() => handleWorkerAction(worker, 'activate')}
                    >
                      <Icon name="check" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                  
                  {worker.status === 'ACTIVE' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deactivateButton]}
                      onPress={() => handleWorkerAction(worker, 'deactivate')}
                    >
                      <Icon name="pause" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => Alert.alert('Edit Worker', 'Edit functionality coming soon')}
                  >
                    <Icon name="pencil" size={16} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => handleWorkerAction(worker, 'remove')}
                  >
                    <Icon name="delete" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Add Worker Dialog */}
      <Portal>
        <Dialog visible={showAddWorkerDialog} onDismiss={() => setShowAddWorkerDialog(false)}>
          <Dialog.Title>Add New Worker</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Full Name"
              value={workerForm.name}
              onChangeText={(text) => setWorkerForm({ ...workerForm, name: text })}
              mode="outlined"
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Email Address"
              value={workerForm.email}
              onChangeText={(text) => setWorkerForm({ ...workerForm, email: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Phone Number"
              value={workerForm.phone}
              onChangeText={(text) => setWorkerForm({ ...workerForm, phone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.dialogInput}
            />
            
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Select Role',
                  'Choose worker role:',
                  [
                    { text: 'Farm Worker', onPress: () => setWorkerForm({ ...workerForm, role: 'Farm Worker' }) },
                    { text: 'Supervisor', onPress: () => setWorkerForm({ ...workerForm, role: 'Supervisor' }) },
                    { text: 'Manager', onPress: () => setWorkerForm({ ...workerForm, role: 'Manager' }) },
                  ]
                );
              }}
            >
              <Text style={styles.pickerButtonText}>
                {workerForm.role}
              </Text>
              <Icon name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddWorkerDialog(false)}>Cancel</Button>
            <Button onPress={handleAddWorker}>Add Worker</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Invite Worker Dialog */}
      <Portal>
        <Dialog visible={showInviteDialog} onDismiss={() => setShowInviteDialog(false)}>
          <Dialog.Title>Invite Worker</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Email Address"
              value={inviteForm.email}
              onChangeText={(text) => setInviteForm({ ...inviteForm, email: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.dialogInput}
            />
            
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Select Role',
                  'Choose worker role:',
                  [
                    { text: 'Farm Worker', onPress: () => setInviteForm({ ...inviteForm, role: 'Farm Worker' }) },
                    { text: 'Supervisor', onPress: () => setInviteForm({ ...inviteForm, role: 'Supervisor' }) },
                    { text: 'Manager', onPress: () => setInviteForm({ ...inviteForm, role: 'Manager' }) },
                  ]
                );
              }}
            >
              <Text style={styles.pickerButtonText}>
                {inviteForm.role}
              </Text>
              <Icon name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TextInput
              label="Personal Message (Optional)"
              value={inviteForm.message}
              onChangeText={(text) => setInviteForm({ ...inviteForm, message: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onPress={handleInviteWorker}>Send Invitation</Button>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  workersCard: {
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
  workerCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workerAvatar: {
    backgroundColor: '#16a34a',
    marginRight: 12,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  workerRole: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  workerContact: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  workerStatus: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  statusChip: {
    marginBottom: 4,
  },
  assignedFlocks: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  lastActive: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  workerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#16a34a',
  },
  deactivateButton: {
    backgroundColor: '#d97706',
  },
  editButton: {
    backgroundColor: '#2563eb',
  },
  removeButton: {
    backgroundColor: '#dc2626',
  },
  dialogInput: {
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
});
