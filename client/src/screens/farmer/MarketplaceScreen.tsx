import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Button, TextInput, Chip, Dialog, Portal, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  seller: string;
  location: string;
  rating: number;
  reviews: number;
  image?: string;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  postedDate: string;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Broiler Feed',
    description: 'High-quality broiler feed with balanced nutrition for optimal growth',
    price: 2500,
    category: 'Feed',
    seller: 'AgroFeed Kenya',
    location: 'Nakuru',
    rating: 4.8,
    reviews: 45,
    status: 'AVAILABLE',
    postedDate: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Vaccination Kit',
    description: 'Complete vaccination kit for poultry with syringes and common vaccines',
    price: 15000,
    category: 'Health',
    seller: 'VetCare Supplies',
    location: 'Nairobi',
    rating: 4.9,
    reviews: 32,
    status: 'AVAILABLE',
    postedDate: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    name: 'Egg Incubator',
    description: 'Automatic egg incubator with temperature control, capacity 100 eggs',
    price: 45000,
    category: 'Equipment',
    seller: 'FarmTech Solutions',
    location: 'Mombasa',
    rating: 4.6,
    reviews: 28,
    status: 'RESERVED',
    postedDate: '2024-01-13T09:15:00Z',
  },
];

const categories = ['All', 'Feed', 'Health', 'Equipment', 'Seeds', 'Livestock'];

export default function MarketplaceScreen() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Feed',
    location: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return '#16a34a';
      case 'SOLD': return '#dc2626';
      case 'RESERVED': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'SOLD': return 'Sold';
      case 'RESERVED': return 'Reserved';
      default: return 'Unknown';
    }
  };

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newProduct: Product = {
      id: `product_${Date.now()}`,
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      category: productForm.category,
      seller: 'Your Farm',
      location: productForm.location,
      rating: 0,
      reviews: 0,
      status: 'AVAILABLE',
      postedDate: new Date().toISOString(),
    };

    setProducts(prev => [newProduct, ...prev]);
    setShowAddProductDialog(false);
    resetProductForm();
    Alert.alert('Success', 'Product listed successfully');
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'Feed',
      location: '',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Icon key={i} name="star" size={16} color="#fbbf24" />);
    }

    if (hasHalfStar) {
      stars.push(<Icon key="half" name="star-half" size={16} color="#fbbf24" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Icon key={`empty-${i}`} name="star-outline" size={16} color="#d1d5db" />);
    }

    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <Text style={styles.headerSubtitle}>
            Buy and sell farm products, equipment, and supplies
          </Text>
        </View>

        {/* Search and Add Product */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="outlined"
            left={<TextInput.Icon icon="magnify" />}
            style={styles.searchInput}
          />
          
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowAddProductDialog(true)}
          >
            <Icon name="plus" size={24} color="white" />
            <Text style={styles.addProductText}>List Product</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Grid */}
        <View style={styles.productsContainer}>
          {filteredProducts.map((product) => (
            <Card key={product.id} style={styles.productCard}>
              <Card.Content>
                <View style={styles.productHeader}>
                  <View style={styles.productImage}>
                    <Icon name="image" size={32} color="#9ca3af" />
                  </View>
                  
                  <View style={styles.productStatus}>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(product.status) }}
                      style={[styles.statusChip, { borderColor: getStatusColor(product.status) }]}
                    >
                      {getStatusText(product.status)}
                    </Chip>
                  </View>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                  
                  <Text style={styles.productPrice}>
                    {formatCurrency(product.price)}
                  </Text>
                  
                  <View style={styles.productMeta}>
                    <View style={styles.ratingContainer}>
                      {renderStars(product.rating)}
                      <Text style={styles.reviewCount}>({product.reviews})</Text>
                    </View>
                    
                    <Text style={styles.productLocation}>
                      📍 {product.location}
                    </Text>
                  </View>
                  
                  <View style={styles.sellerInfo}>
                    <Avatar.Text 
                      size={24} 
                      label={product.seller.split(' ').map(n => n[0]).join('')}
                      style={styles.sellerAvatar}
                    />
                    <Text style={styles.sellerName}>{product.seller}</Text>
                  </View>
                  
                  <Text style={styles.postedDate}>
                    Posted {formatDate(product.postedDate)}
                  </Text>
                </View>

                <View style={styles.productActions}>
                  {product.status === 'AVAILABLE' && (
                    <>
                      <Button
                        mode="contained"
                        onPress={() => Alert.alert('Contact Seller', 'Contact functionality coming soon')}
                        style={styles.contactButton}
                      >
                        Contact Seller
                      </Button>
                      
                      <Button
                        mode="outlined"
                        onPress={() => Alert.alert('Reserve', 'Reservation functionality coming soon')}
                        style={styles.reserveButton}
                      >
                        Reserve
                      </Button>
                    </>
                  )}
                  
                  {product.status === 'RESERVED' && (
                    <Button
                      mode="outlined"
                      disabled
                      style={styles.reservedButton}
                    >
                      Reserved
                    </Button>
                  )}
                  
                  {product.status === 'SOLD' && (
                    <Button
                      mode="outlined"
                      disabled
                      style={styles.soldButton}
                    >
                      Sold
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="package-variant" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No Products Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or category filters
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Product Dialog */}
      <Portal>
        <Dialog visible={showAddProductDialog} onDismiss={() => setShowAddProductDialog(false)}>
          <Dialog.Title>List New Product</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Product Name"
              value={productForm.name}
              onChangeText={(text) => setProductForm({ ...productForm, name: text })}
              mode="outlined"
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Description"
              value={productForm.description}
              onChangeText={(text) => setProductForm({ ...productForm, description: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Price (KES)"
              value={productForm.price}
              onChangeText={(text) => setProductForm({ ...productForm, price: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Select Category',
                  'Choose product category:',
                  [
                    { text: 'Feed', onPress: () => setProductForm({ ...productForm, category: 'Feed' }) },
                    { text: 'Health', onPress: () => setProductForm({ ...productForm, category: 'Health' }) },
                    { text: 'Equipment', onPress: () => setProductForm({ ...productForm, category: 'Equipment' }) },
                    { text: 'Seeds', onPress: () => setProductForm({ ...productForm, category: 'Seeds' }) },
                    { text: 'Livestock', onPress: () => setProductForm({ ...productForm, category: 'Livestock' }) },
                  ]
                );
              }}
            >
              <Text style={styles.pickerButtonText}>
                {productForm.category}
              </Text>
              <Icon name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TextInput
              label="Location"
              value={productForm.location}
              onChangeText={(text) => setProductForm({ ...productForm, location: text })}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddProductDialog(false)}>Cancel</Button>
            <Button onPress={handleAddProduct}>List Product</Button>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  addProductButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addProductText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedCategoryChip: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  categoryText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: 'white',
  },
  productsContainer: {
    padding: 16,
    gap: 16,
  },
  productCard: {
    elevation: 2,
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 12,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  productLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sellerAvatar: {
    backgroundColor: '#16a34a',
  },
  sellerName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  postedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    backgroundColor: '#16a34a',
    flex: 1,
  },
  reserveButton: {
    borderColor: '#2563eb',
    flex: 1,
  },
  reservedButton: {
    borderColor: '#d97706',
    flex: 1,
  },
  soldButton: {
    borderColor: '#dc2626',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
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
