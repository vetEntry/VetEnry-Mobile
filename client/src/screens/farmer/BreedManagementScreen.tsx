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
import { Card, Title, Paragraph, Button, FAB, Chip, Dialog, Portal, TextInput as PaperTextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface Breed {
  id: string;
  name: string;
  category: 'Broiler' | 'Kienyeji' | 'Improved';
  description: string;
  characteristics: string[];
  averageWeight: number;
  eggProduction?: number;
  maturityAge: number;
  isActive: boolean;
  createdAt: string;
}

export default function BreedManagementScreen() {
  const navigation = useNavigation();
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddBreedDialog, setShowAddBreedDialog] = useState(false);
  const [editingBreed, setEditingBreed] = useState<Breed | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Broiler' | 'Kienyeji' | 'Improved'>('all');

  // Form state
  const [breedForm, setBreedForm] = useState({
    name: '',
    category: 'Broiler' as 'Broiler' | 'Kienyeji' | 'Improved',
    description: '',
    characteristics: '',
    averageWeight: '',
    eggProduction: '',
    maturityAge: '',
  });

  useEffect(() => {
    loadBreeds();
  }, []);

  const loadBreeds = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with API call
      // const response = await farmerAPI.getBreeds();
      // setBreeds(response.breeds || []);
      
      // Mock data for now
      setBreeds([
        {
          id: '1',
          name: 'Cobb 500',
          category: 'Broiler',
          description: 'Fast-growing broiler breed with excellent feed conversion',
          characteristics: ['Fast growth', 'High feed conversion', 'Good meat quality'],
          averageWeight: 2.5,
          maturityAge: 42,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Kienyeji Local',
          category: 'Kienyeji',
          description: 'Traditional free-range chicken breed',
          characteristics: ['Disease resistant', 'Good for free range', 'Natural foraging'],
          averageWeight: 1.2,
          eggProduction: 120,
          maturityAge: 180,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error loading breeds:', error);
      Alert.alert('Error', 'Failed to load breeds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBreed = async () => {
    if (!breedForm.name || !breedForm.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const newBreed: Breed = {
        id: Date.now().toString(),
        name: breedForm.name,
        category: breedForm.category,
        description: breedForm.description,
        characteristics: breedForm.characteristics.split(',').map(c => c.trim()).filter(c => c),
        averageWeight: parseFloat(breedForm.averageWeight) || 0,
        eggProduction: breedForm.eggProduction ? parseFloat(breedForm.eggProduction) : undefined,
        maturityAge: parseInt(breedForm.maturityAge) || 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      setBreeds(prev => [...prev, newBreed]);
      Alert.alert('Success', 'Breed added successfully');
      setShowAddBreedDialog(false);
      resetBreedForm();
    } catch (error) {
      console.error('Error adding breed:', error);
      Alert.alert('Error', 'Failed to add breed');
    }
  };

  const handleEditBreed = (breed: Breed) => {
    setEditingBreed(breed);
    setBreedForm({
      name: breed.name,
      category: breed.category,
      description: breed.description,
      characteristics: breed.characteristics.join(', '),
      averageWeight: breed.averageWeight.toString(),
      eggProduction: breed.eggProduction?.toString() || '',
      maturityAge: breed.maturityAge.toString(),
    });
    setShowAddBreedDialog(true);
  };

  const handleUpdateBreed = async () => {
    if (!editingBreed) return;

    try {
      const updatedBreed: Breed = {
        ...editingBreed,
        name: breedForm.name,
        category: breedForm.category,
        description: breedForm.description,
        characteristics: breedForm.characteristics.split(',').map(c => c.trim()).filter(c => c),
        averageWeight: parseFloat(breedForm.averageWeight) || 0,
        eggProduction: breedForm.eggProduction ? parseFloat(breedForm.eggProduction) : undefined,
        maturityAge: parseInt(breedForm.maturityAge) || 0,
      };

      setBreeds(prev => prev.map(b => b.id === editingBreed.id ? updatedBreed : b));
      Alert.alert('Success', 'Breed updated successfully');
      setShowAddBreedDialog(false);
      setEditingBreed(null);
      resetBreedForm();
    } catch (error) {
      console.error('Error updating breed:', error);
      Alert.alert('Error', 'Failed to update breed');
    }
  };

  const handleDeleteBreed = (breedId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this breed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBreeds(prev => prev.filter(b => b.id !== breedId));
            Alert.alert('Success', 'Breed deleted successfully');
          },
        },
      ]
    );
  };

  const resetBreedForm = () => {
    setBreedForm({
      name: '',
      category: 'Broiler',
      description: '',
      characteristics: '',
      averageWeight: '',
      eggProduction: '',
      maturityAge: '',
    });
  };

  const filteredBreeds = breeds.filter(breed => 
    selectedCategory === 'all' || breed.category === selectedCategory
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Broiler': return '#16a34a';
      case 'Kienyeji': return '#d97706';
      case 'Improved': return '#2563eb';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Breed Management</Title>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Category:</Text>
          <View style={styles.filterChips}>
            {['all', 'Broiler', 'Kienyeji', 'Improved'].map((category) => (
              <Chip
                key={category}
                mode={selectedCategory === category ? 'flat' : 'outlined'}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category as any)}
                style={[
                  styles.filterChip,
                  selectedCategory === category && { backgroundColor: getCategoryColor(category) }
                ]}
                textStyle={{
                  color: selectedCategory === category ? 'white' : getCategoryColor(category)
                }}
              >
                {category}
              </Chip>
            ))}
          </View>
        </View>

        {/* Breeds List */}
        {filteredBreeds.map((breed) => (
          <Card key={breed.id} style={styles.breedCard}>
            <Card.Content>
              <View style={styles.breedHeader}>
                <View style={styles.breedInfo}>
                  <Title style={styles.breedName}>{breed.name}</Title>
                  <Chip
                    mode="outlined"
                    style={[styles.categoryChip, { borderColor: getCategoryColor(breed.category) }]}
                    textStyle={{ color: getCategoryColor(breed.category) }}
                  >
                    {breed.category}
                  </Chip>
                </View>
                <View style={styles.breedActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditBreed(breed)}
                  >
                    <Icon name="pencil" size={20} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteBreed(breed.id)}
                  >
                    <Icon name="delete" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>

              <Paragraph style={styles.breedDescription}>
                {breed.description}
              </Paragraph>

              <View style={styles.breedStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg Weight</Text>
                  <Text style={styles.statValue}>{breed.averageWeight} kg</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Maturity Age</Text>
                  <Text style={styles.statValue}>{breed.maturityAge} days</Text>
                </View>
                {breed.eggProduction && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Egg Production</Text>
                    <Text style={styles.statValue}>{breed.eggProduction}/year</Text>
                  </View>
                )}
              </View>

              {breed.characteristics.length > 0 && (
                <View style={styles.characteristicsContainer}>
                  <Text style={styles.characteristicsLabel}>Characteristics:</Text>
                  <View style={styles.characteristicsList}>
                    {breed.characteristics.map((characteristic, index) => (
                      <Chip key={index} mode="outlined" style={styles.characteristicChip}>
                        {characteristic}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Add Breed FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          setEditingBreed(null);
          resetBreedForm();
          setShowAddBreedDialog(true);
        }}
      />

      {/* Add/Edit Breed Dialog */}
      <Portal>
        <Dialog visible={showAddBreedDialog} onDismiss={() => setShowAddBreedDialog(false)}>
          <Dialog.Title>
            {editingBreed ? 'Edit Breed' : 'Add New Breed'}
          </Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Breed Name"
              value={breedForm.name}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, name: text }))}
              mode="outlined"
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Description"
              value={breedForm.description}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, description: text }))}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Characteristics (comma-separated)"
              value={breedForm.characteristics}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, characteristics: text }))}
              mode="outlined"
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Average Weight (kg)"
              value={breedForm.averageWeight}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, averageWeight: text }))}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Egg Production (per year)"
              value={breedForm.eggProduction}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, eggProduction: text }))}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />

            <PaperTextInput
              label="Maturity Age (days)"
              value={breedForm.maturityAge}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, maturityAge: text }))}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddBreedDialog(false)}>Cancel</Button>
            <Button onPress={editingBreed ? handleUpdateBreed : handleAddBreed}>
              {editingBreed ? 'Update' : 'Add'}
            </Button>
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
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
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
  breedCard: {
    marginBottom: 16,
    elevation: 2,
  },
  breedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  breedInfo: {
    flex: 1,
  },
  breedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  breedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  breedDescription: {
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  breedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  characteristicsContainer: {
    marginTop: 10,
  },
  characteristicsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  characteristicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  characteristicChip: {
    marginRight: 6,
    marginBottom: 6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#16a34a',
  },
  dialogInput: {
    marginBottom: 16,
  },
});
