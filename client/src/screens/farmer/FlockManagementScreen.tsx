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
import { Card, Title, Paragraph, Button, FAB, Chip, Searchbar, Dialog, Portal, TextInput as PaperTextInput, Switch } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { farmerAPI } from '../../services/api';

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

interface SimplifiedBreed {
  id: string;
  name: string;
  category: 'Broiler' | 'Kienyeji' | 'Improved';
  description?: string;
  characteristics?: string[];
  isActive: boolean;
}

const initialBreeds: SimplifiedBreed[] = [
  {
    id: '1',
    name: 'Broiler Cobb 500',
    category: 'Broiler',
    description: 'Fast-growing broiler breed with excellent feed conversion',
    characteristics: ['Fast growth', 'High feed efficiency', 'Good meat quality'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Kienyeji Local',
    category: 'Kienyeji',
    description: 'Traditional free-range chicken breed',
    characteristics: ['Disease resistant', 'Good for free-range', 'Natural behavior'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Improved Layer',
    category: 'Improved',
    description: 'High-yielding layer breed for commercial egg production',
    characteristics: ['High egg production', 'Good feed efficiency', 'Disease resistant'],
    isActive: true,
  },
];

export default function FlockManagementScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'flock' | 'farm' | 'breed'>('flock');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [simplifiedBreeds, setSimplifiedBreeds] = useState<SimplifiedBreed[]>(initialBreeds);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBreed, setFilterBreed] = useState<string>('all');

  // Dialog states
  const [showAddFlockDialog, setShowAddFlockDialog] = useState(false);
  const [showAddFarmDialog, setShowAddFarmDialog] = useState(false);
  const [showAddBreedDialog, setShowAddBreedDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [flockForm, setFlockForm] = useState({
    name: '',
    breed: '',
    species: '',
    quantity: '',
    unitPrice: '',
    startDate: '',
    expectedEndDate: '',
  });

  const [farmForm, setFarmForm] = useState({
    name: '',
    farmType: [] as string[],
    farmSize: '',
    address: '',
    city: '',
    state: '',
  });

  const [breedForm, setBreedForm] = useState({
    name: '',
    category: 'Broiler' as 'Broiler' | 'Kienyeji' | 'Improved',
    description: '',
    characteristics: [] as string[],
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      loadFlocks(selectedFarm.id);
    }
  }, [selectedFarm]);

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

  const handleAddFlock = async () => {
    if (!flockForm.name || !flockForm.breed || !flockForm.quantity || !flockForm.startDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const flockData = {
        ...flockForm,
        quantity: Number(flockForm.quantity),
        unitPrice: flockForm.unitPrice ? Number(flockForm.unitPrice) : undefined,
        farmId: selectedFarm?.id,
      };

      await farmerAPI.createFlock(flockData);
      Alert.alert('Success', 'Flock created successfully');
      setShowAddFlockDialog(false);
      resetFlockForm();
      if (selectedFarm) {
        loadFlocks(selectedFarm.id);
      }
    } catch (error) {
      console.error('Error creating flock:', error);
      Alert.alert('Error', 'Failed to create flock');
    }
  };

  const handleAddFarm = async () => {
    if (!farmForm.name || farmForm.farmType.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const farmData = {
        ...farmForm,
        farmSize: farmForm.farmSize ? Number(farmForm.farmSize) : undefined,
      };

      await farmerAPI.createFarm(farmData);
      Alert.alert('Success', 'Farm created successfully');
      setShowAddFarmDialog(false);
      resetFarmForm();
      loadFarms();
    } catch (error) {
      console.error('Error creating farm:', error);
      Alert.alert('Error', 'Failed to create farm');
    }
  };

  const handleAddBreed = async () => {
    if (!breedForm.name || !breedForm.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const newBreed: SimplifiedBreed = {
        id: Date.now().toString(),
        name: breedForm.name,
        category: breedForm.category,
        description: breedForm.description,
        characteristics: breedForm.characteristics,
        isActive: true,
      };

      setSimplifiedBreeds(prev => [...prev, newBreed]);
      Alert.alert('Success', 'Breed added successfully');
      setShowAddBreedDialog(false);
      resetBreedForm();
    } catch (error) {
      console.error('Error adding breed:', error);
      Alert.alert('Error', 'Failed to add breed');
    }
  };

  const handleEditItem = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    setShowEditDialog(true);
  };

  const handleDeleteItem = (item: any, type: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'flock') {
                await farmerAPI.deleteFlock(item.id);
                if (selectedFarm) {
                  loadFlocks(selectedFarm.id);
                }
              } else if (type === 'farm') {
                await farmerAPI.deleteFarm(item.id);
                loadFarms();
              } else if (type === 'breed') {
                setSimplifiedBreeds(prev => prev.filter(b => b.id !== item.id));
              }
              Alert.alert('Success', `${type} deleted successfully`);
            } catch (error) {
              console.error(`Error deleting ${type}:`, error);
              Alert.alert('Error', `Failed to delete ${type}`);
            }
          },
        },
      ]
    );
  };

  const resetFlockForm = () => {
    setFlockForm({
      name: '',
      breed: '',
      species: '',
      quantity: '',
      unitPrice: '',
      startDate: '',
      expectedEndDate: '',
    });
  };

  const resetFarmForm = () => {
    setFarmForm({
      name: '',
      farmType: [],
      farmSize: '',
      address: '',
      city: '',
      state: '',
    });
  };

  const resetBreedForm = () => {
    setBreedForm({
      name: '',
      category: 'Broiler',
      description: '',
      characteristics: [],
    });
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

  const filteredFlocks = flocks.filter(flock => {
    const matchesSearch = flock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flock.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || flock.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesBreed = filterBreed === 'all' || flock.breed.toLowerCase().includes(filterBreed.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesBreed;
  });

  const filteredFarms = farms.filter(farm => {
    return farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           farm.farmType.some(type => type.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredBreeds = simplifiedBreeds.filter(breed => {
    return breed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           breed.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flock':
        return (
          <View>
            {/* Search and Filters */}
            <View style={styles.searchFiltersContainer}>
              <Searchbar
                placeholder="Search flocks..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
              />
              <View style={styles.filtersRow}>
                <TouchableOpacity
                  style={[styles.filterChip, filterStatus === 'all' && styles.activeFilterChip]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text style={[styles.filterChipText, filterStatus === 'all' && styles.activeFilterChipText]}>
                    All Status
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterStatus === 'active' && styles.activeFilterChip]}
                  onPress={() => setFilterStatus('active')}
                >
                  <Text style={[styles.filterChipText, filterStatus === 'active' && styles.activeFilterChipText]}>
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterStatus === 'completed' && styles.activeFilterChip]}
                  onPress={() => setFilterStatus('completed')}
                >
                  <Text style={[styles.filterChipText, filterStatus === 'completed' && styles.activeFilterChipText]}>
                    Completed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Flocks List */}
            {filteredFlocks.map((flock) => (
              <Card key={flock.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{flock.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {flock.breed} • {flock.quantity} birds
                      </Text>
                      <Text style={styles.itemDetails}>
                        Age: {calculateAge(flock.startDate)} days • 
                        Phase: {getProductionPhase(calculateAge(flock.startDate), flock.breed)}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <Chip
                        mode="outlined"
                        textStyle={{ color: getStatusColor(flock.status) }}
                        style={[styles.statusChip, { borderColor: getStatusColor(flock.status) }]}
                      >
                        {flock.status}
                      </Chip>
                      {flock.health && (
                        <Chip
                          mode="outlined"
                          textStyle={{ color: getHealthBadge(flock.health).color }}
                          style={[styles.healthChip, { borderColor: getHealthBadge(flock.health).color }]}
                        >
                          {getHealthBadge(flock.health).text}
                        </Chip>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.itemMetrics}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Mortality</Text>
                      <Text style={styles.metricValue}>{flock.mortality || 0}%</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Feed Conversion</Text>
                      <Text style={styles.metricValue}>{flock.feedConversion || 'N/A'}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Value</Text>
                      <Text style={styles.metricValue}>
                        {flock.unitPrice ? `KES ${(flock.unitPrice * flock.quantity).toLocaleString()}` : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemFooter}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditItem(flock, 'flock')}
                    >
                      <Icon name="pencil" size={16} color="#2563eb" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => (navigation as any).navigate('FlockDetails', { flockId: flock.id })}
                    >
                      <Icon name="eye" size={16} color="#16a34a" />
                      <Text style={styles.actionButtonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteItem(flock, 'flock')}
                    >
                      <Icon name="delete" size={16} color="#dc2626" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            ))}

            {filteredFlocks.length === 0 && (
              <Card style={styles.emptyStateCard}>
                <Card.Content style={styles.emptyStateContent}>
                  <Icon name="egg" size={64} color="#9ca3af" />
                  <Title style={styles.emptyStateTitle}>No Flocks Found</Title>
                  <Paragraph style={styles.emptyStateText}>
                    {searchQuery || filterStatus !== 'all' 
                      ? 'No flocks match your search criteria'
                      : 'Get started by adding your first flock'
                    }
                  </Paragraph>
                  {!searchQuery && filterStatus === 'all' && (
                    <Button
                      mode="contained"
                      onPress={() => setShowAddFlockDialog(true)}
                      style={styles.addButton}
                    >
                      Add Your First Flock
                    </Button>
                  )}
                </Card.Content>
              </Card>
            )}
          </View>
        );

      case 'farm':
        return (
          <View>
            {/* Search */}
            <Searchbar
              placeholder="Search farms..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />

            {/* Farms List */}
            {filteredFarms.map((farm) => (
              <Card key={farm.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{farm.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {farm.farmType.join(', ')} • {farm.farmSize ? `${farm.farmSize} acres` : 'Size not specified'}
                      </Text>
                      <Text style={styles.itemDetails}>
                        {farm.address}, {farm.city}, {farm.state}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <Chip
                        mode="outlined"
                        textStyle={{ color: farm.isActive ? '#16a34a' : '#dc2626' }}
                        style={[styles.statusChip, { borderColor: farm.isActive ? '#16a34a' : '#dc2626' }]}
                      >
                        {farm.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                      <Text style={styles.flockCount}>{farm.flockCount || 0} flocks</Text>
                    </View>
                  </View>

                  <View style={styles.itemFooter}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditItem(farm, 'farm')}
                    >
                      <Icon name="pencil" size={16} color="#2563eb" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => (navigation as any).navigate('FarmDetails', { farmId: farm.id })}
                    >
                      <Icon name="eye" size={16} color="#16a34a" />
                      <Text style={styles.actionButtonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteItem(farm, 'farm')}
                    >
                      <Icon name="delete" size={16} color="#dc2626" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            ))}

            {filteredFarms.length === 0 && (
              <Card style={styles.emptyStateCard}>
                <Card.Content style={styles.emptyStateContent}>
                  <Icon name="farm" size={64} color="#9ca3af" />
                  <Title style={styles.emptyStateTitle}>No Farms Found</Title>
                  <Paragraph style={styles.emptyStateText}>
                    {searchQuery 
                      ? 'No farms match your search criteria'
                      : 'Get started by creating your first farm'
                    }
                  </Paragraph>
                  {!searchQuery && (
                    <Button
                      mode="contained"
                      onPress={() => setShowAddFarmDialog(true)}
                      style={styles.addButton}
                    >
                      Create Your First Farm
                    </Button>
                  )}
                </Card.Content>
              </Card>
            )}
          </View>
        );

      case 'breed':
        return (
          <View>
            {/* Search */}
            <Searchbar
              placeholder="Search breeds..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />

            {/* Breeds List */}
            {filteredBreeds.map((breed) => (
              <Card key={breed.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{breed.name}</Text>
                      <Chip
                        mode="outlined"
                        textStyle={{ color: '#16a34a' }}
                        style={[styles.categoryChip, { borderColor: '#16a34a' }]}
                      >
                        {breed.category}
                      </Chip>
                      <Text style={styles.itemDescription}>{breed.description}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <Switch
                        value={breed.isActive}
                        onValueChange={(value) => {
                          setSimplifiedBreeds(prev =>
                            prev.map(b => b.id === breed.id ? { ...b, isActive: value } : b)
                          );
                        }}
                        color="#16a34a"
                      />
                    </View>
                  </View>

                  {breed.characteristics && breed.characteristics.length > 0 && (
                    <View style={styles.characteristicsContainer}>
                      <Text style={styles.characteristicsLabel}>Characteristics:</Text>
                      <View style={styles.characteristicsList}>
                        {breed.characteristics.map((char, index) => (
                          <Chip key={index} mode="outlined" style={styles.characteristicChip}>
                            {char}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.itemFooter}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditItem(breed, 'breed')}
                    >
                      <Icon name="pencil" size={16} color="#2563eb" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteItem(breed, 'breed')}
                    >
                      <Icon name="delete" size={16} color="#dc2626" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            ))}

            {filteredBreeds.length === 0 && (
              <Card style={styles.emptyStateCard}>
                <Card.Content style={styles.emptyStateContent}>
                  <Icon name="egg" size={64} color="#9ca3af" />
                  <Title style={styles.emptyStateTitle}>No Breeds Found</Title>
                  <Paragraph style={styles.emptyStateText}>
                    {searchQuery 
                      ? 'No breeds match your search criteria'
                      : 'Get started by adding your first breed'
                    }
                  </Paragraph>
                  {!searchQuery && (
                    <Button
                      mode="contained"
                      onPress={() => setShowAddBreedDialog(true)}
                      style={styles.addButton}
                    >
                      Add Your First Breed
                    </Button>
                  )}
                </Card.Content>
              </Card>
            )}
          </View>
        );

      default:
        return null;
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm & Flock Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => {
              switch (activeTab) {
                case 'flock':
                  setShowAddFlockDialog(true);
                  break;
                case 'farm':
                  setShowAddFarmDialog(true);
                  break;
                case 'breed':
                  setShowAddBreedDialog(true);
                  break;
              }
            }}
          >
            <Icon name="plus" size={24} color="#16a34a" />
          </TouchableOpacity>
        </View>
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

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'flock' && styles.activeTab]}
          onPress={() => setActiveTab('flock')}
        >
          <Icon 
            name="egg" 
            size={20} 
            color={activeTab === 'flock' ? '#16a34a' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'flock' && styles.activeTabText]}>
            Flock Management
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'farm' && styles.activeTab]}
          onPress={() => setActiveTab('farm')}
        >
          <Icon 
            name="farm" 
            size={20} 
            color={activeTab === 'farm' ? '#16a34a' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'farm' && styles.activeTabText]}>
            Farm Management
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'breed' && styles.activeTab]}
          onPress={() => setActiveTab('breed')}
        >
          <Icon 
            name="egg" 
            size={20} 
            color={activeTab === 'breed' ? '#16a34a' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'breed' && styles.activeTabText]}>
            Breed Management
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Add Flock Dialog */}
      <Portal>
        <Dialog visible={showAddFlockDialog} onDismiss={() => setShowAddFlockDialog(false)}>
          <Dialog.Title>Add New Flock</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Flock Name"
              value={flockForm.name}
              onChangeText={(text) => setFlockForm(prev => ({ ...prev, name: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Breed"
              value={flockForm.breed}
              onChangeText={(text) => setFlockForm(prev => ({ ...prev, breed: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Species"
              value={flockForm.species}
              onChangeText={(text) => setFlockForm(prev => ({ ...prev, species: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Quantity"
              value={flockForm.quantity}
              onChangeText={(text) => setFlockForm(prev => ({ ...prev, quantity: text }))}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Unit Price (optional)"
              value={flockForm.unitPrice}
              onChangeText={(text) => setFlockForm(prev => ({ ...prev, unitPrice: text }))}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Start Date"
              value={flockForm.startDate}
              onChangeText={(text) => setFlockForm(prev => ({ ...prev, startDate: text }))}
              placeholder="YYYY-MM-DD"
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Expected End Date (optional)"
              value={flockForm.expectedEndDate}
              onChangeText={(text) => setFlockForm(prev => ({ ...prev, expectedEndDate: text }))}
              placeholder="YYYY-MM-DD"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddFlockDialog(false)}>Cancel</Button>
            <Button onPress={handleAddFlock}>Add Flock</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Farm Dialog */}
      <Portal>
        <Dialog visible={showAddFarmDialog} onDismiss={() => setShowAddFarmDialog(false)}>
          <Dialog.Title>Add New Farm</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Farm Name"
              value={farmForm.name}
              onChangeText={(text) => setFarmForm(prev => ({ ...prev, name: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Farm Type (comma separated)"
              value={farmForm.farmType.join(', ')}
              onChangeText={(text) => setFarmForm(prev => ({ 
                ...prev, 
                farmType: text.split(',').map(t => t.trim()).filter(t => t) 
              }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Farm Size (acres)"
              value={farmForm.farmSize}
              onChangeText={(text) => setFarmForm(prev => ({ ...prev, farmSize: text }))}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Address"
              value={farmForm.address}
              onChangeText={(text) => setFarmForm(prev => ({ ...prev, address: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="City"
              value={farmForm.city}
              onChangeText={(text) => setFarmForm(prev => ({ ...prev, city: text }))}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="State"
              value={farmForm.state}
              onChangeText={(text) => setFarmForm(prev => ({ ...prev, state: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddFarmDialog(false)}>Cancel</Button>
            <Button onPress={handleAddFarm}>Add Farm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Breed Dialog */}
      <Portal>
        <Dialog visible={showAddBreedDialog} onDismiss={() => setShowAddBreedDialog(false)}>
          <Dialog.Title>Add New Breed</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Breed Name"
              value={breedForm.name}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, name: text }))}
              style={styles.dialogInput}
            />
            <View style={styles.categorySelector}>
              <Text style={styles.categoryLabel}>Category:</Text>
              <View style={styles.categoryOptions}>
                {(['Broiler', 'Kienyeji', 'Improved'] as const).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      breedForm.category === category && styles.selectedCategoryOption
                    ]}
                    onPress={() => setBreedForm(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      breedForm.category === category && styles.selectedCategoryOptionText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <PaperTextInput
              label="Description (optional)"
              value={breedForm.description}
              onChangeText={(text) => setBreedForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <PaperTextInput
              label="Characteristics (comma separated)"
              value={breedForm.characteristics.join(', ')}
              onChangeText={(text) => setBreedForm(prev => ({ 
                ...prev, 
                characteristics: text.split(',').map(t => t.trim()).filter(t => t) 
              }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddBreedDialog(false)}>Cancel</Button>
            <Button onPress={handleAddBreed}>Add Breed</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit {editingItem?.type}</Dialog.Title>
          <Dialog.Content>
            <Text>Edit functionality coming soon...</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Close</Button>
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
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#16a34a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchFiltersContainer: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
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
  itemCard: {
    marginBottom: 16,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#9ca3af',
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 8,
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  healthChip: {
    marginBottom: 4,
  },
  categoryChip: {
    marginBottom: 8,
  },
  flockCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  itemMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  characteristicsContainer: {
    marginBottom: 12,
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
    gap: 8,
  },
  characteristicChip: {
    borderColor: '#d1d5db',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
  categorySelector: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  selectedCategoryOption: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCategoryOptionText: {
    color: 'white',
  },
});

