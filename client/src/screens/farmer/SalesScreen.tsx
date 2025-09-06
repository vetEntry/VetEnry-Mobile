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
import { Card, Title, Button, TextInput, Chip, Dialog, Portal } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Sale {
  id: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customer: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  paymentMethod: string;
}

const mockSales: Sale[] = [
  {
    id: '1',
    product: 'Broiler Chickens',
    quantity: 50,
    unitPrice: 2500,
    totalAmount: 125000,
    customer: 'Nakuru Poultry Ltd',
    date: '2024-01-15T10:30:00Z',
    status: 'COMPLETED',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: '2',
    product: 'Eggs (Trays)',
    quantity: 20,
    unitPrice: 800,
    totalAmount: 16000,
    customer: 'Local Market',
    date: '2024-01-14T14:20:00Z',
    status: 'COMPLETED',
    paymentMethod: 'Cash',
  },
  {
    id: '3',
    product: 'Kienyeji Chickens',
    quantity: 30,
    unitPrice: 3500,
    totalAmount: 105000,
    customer: 'Nairobi Restaurant',
    date: '2024-01-13T09:15:00Z',
    status: 'PENDING',
    paymentMethod: 'M-Pesa',
  },
];

export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [showAddSaleDialog, setShowAddSaleDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Form states
  const [saleForm, setSaleForm] = useState({
    product: '',
    quantity: '',
    unitPrice: '',
    customer: '',
    paymentMethod: 'Cash',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#16a34a';
      case 'PENDING': return '#d97706';
      case 'CANCELLED': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'PENDING': return 'Pending';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const handleAddSale = () => {
    if (!saleForm.product || !saleForm.quantity || !saleForm.unitPrice || !saleForm.customer) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      product: saleForm.product,
      quantity: Number(saleForm.quantity),
      unitPrice: Number(saleForm.unitPrice),
      totalAmount: Number(saleForm.quantity) * Number(saleForm.unitPrice),
      customer: saleForm.customer,
      date: new Date().toISOString(),
      status: 'PENDING',
      paymentMethod: saleForm.paymentMethod,
    };

    setSales(prev => [newSale, ...prev]);
    setShowAddSaleDialog(false);
    resetSaleForm();
    Alert.alert('Success', 'Sale recorded successfully');
  };

  const handleSaleAction = (sale: Sale, action: string) => {
    switch (action) {
      case 'complete':
        setSales(prev => prev.map(s => 
          s.id === sale.id ? { ...s, status: 'COMPLETED' as any } : s
        ));
        Alert.alert('Success', 'Sale marked as completed');
        break;
      case 'cancel':
        setSales(prev => prev.map(s => 
          s.id === sale.id ? { ...s, status: 'CANCELLED' as any } : s
        ));
        Alert.alert('Success', 'Sale cancelled');
        break;
      case 'delete':
        Alert.alert(
          'Confirm Deletion',
          `Are you sure you want to delete this sale?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                setSales(prev => prev.filter(s => s.id !== sale.id));
                Alert.alert('Success', 'Sale deleted successfully');
              },
            },
          ]
        );
        break;
    }
  };

  const resetSaleForm = () => {
    setSaleForm({
      product: '',
      quantity: '',
      unitPrice: '',
      customer: '',
      paymentMethod: 'Cash',
    });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const totalRevenue = sales
    .filter(sale => sale.status === 'COMPLETED')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  const pendingAmount = sales
    .filter(sale => sale.status === 'PENDING')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  const totalSales = sales.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sales & Revenue</Text>
          <Text style={styles.headerSubtitle}>
            Track your sales, revenue, and customer transactions
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowAddSaleDialog(true)}
          >
            <Icon name="plus" size={24} color="#16a34a" />
            <Text style={styles.quickActionText}>Record Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Coming Soon', 'Export functionality will be available soon')}
          >
            <Icon name="download" size={24} color="#2563eb" />
            <Text style={styles.quickActionText}>Export Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Coming Soon', 'Analytics dashboard will be available soon')}
          >
            <Icon name="chart-line" size={24} color="#d97706" />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Sales Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="currency-usd" size={32} color="#16a34a" />
              <Text style={styles.statNumber}>{formatCurrency(totalRevenue)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="clock" size={32} color="#d97706" />
              <Text style={styles.statNumber}>{formatCurrency(pendingAmount)}</Text>
              <Text style={styles.statLabel}>Pending Amount</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="cart" size={32} color="#2563eb" />
              <Text style={styles.statNumber}>{totalSales}</Text>
              <Text style={styles.statLabel}>Total Sales</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Sales List */}
        <Card style={styles.salesCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Recent Sales</Title>
              <Text style={styles.saleCount}>{sales.length} transactions</Text>
            </View>

            {sales.map((sale) => (
              <View key={sale.id} style={styles.saleItem}>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleProduct}>{sale.product}</Text>
                  <Text style={styles.saleCustomer}>{sale.customer}</Text>
                  <Text style={styles.saleDetails}>
                    {sale.quantity} units × {formatCurrency(sale.unitPrice)}
                  </Text>
                  <Text style={styles.saleDate}>{formatDate(sale.date)}</Text>
                </View>

                <View style={styles.saleStatus}>
                  <Chip
                    mode="outlined"
                    textStyle={{ color: getStatusColor(sale.status) }}
                    style={[styles.statusChip, { borderColor: getStatusColor(sale.status) }]}
                  >
                    {getStatusText(sale.status)}
                  </Chip>
                  
                  <Text style={styles.saleAmount}>
                    {formatCurrency(sale.totalAmount)}
                  </Text>
                  
                  <Text style={styles.paymentMethod}>
                    {sale.paymentMethod}
                  </Text>
                </View>

                <View style={styles.saleActions}>
                  {sale.status === 'PENDING' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => handleSaleAction(sale, 'complete')}
                    >
                      <Icon name="check" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                  
                  {sale.status === 'PENDING' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleSaleAction(sale, 'cancel')}
                    >
                      <Icon name="close" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => Alert.alert('Edit Sale', 'Edit functionality coming soon')}
                  >
                    <Icon name="pencil" size={16} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleSaleAction(sale, 'delete')}
                  >
                    <Icon name="delete" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Add Sale Dialog */}
      <Portal>
        <Dialog visible={showAddSaleDialog} onDismiss={() => setShowAddSaleDialog(false)}>
          <Dialog.Title>Record New Sale</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Product/Service"
              value={saleForm.product}
              onChangeText={(text) => setSaleForm({ ...saleForm, product: text })}
              mode="outlined"
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Quantity"
              value={saleForm.quantity}
              onChangeText={(text) => setSaleForm({ ...saleForm, quantity: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Unit Price (KES)"
              value={saleForm.unitPrice}
              onChangeText={(text) => setSaleForm({ ...saleForm, unitPrice: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Customer Name"
              value={saleForm.customer}
              onChangeText={(text) => setSaleForm({ ...saleForm, customer: text })}
              mode="outlined"
              style={styles.dialogInput}
            />
            
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Select Payment Method',
                  'Choose payment method:',
                  [
                    { text: 'Cash', onPress: () => setSaleForm({ ...saleForm, paymentMethod: 'Cash' }) },
                    { text: 'M-Pesa', onPress: () => setSaleForm({ ...saleForm, paymentMethod: 'M-Pesa' }) },
                    { text: 'Bank Transfer', onPress: () => setSaleForm({ ...saleForm, paymentMethod: 'Bank Transfer' }) },
                    { text: 'Card', onPress: () => setSaleForm({ ...saleForm, paymentMethod: 'Card' }) },
                  ]
                );
              }}
            >
              <Text style={styles.pickerButtonText}>
                {saleForm.paymentMethod}
              </Text>
              <Icon name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddSaleDialog(false)}>Cancel</Button>
            <Button onPress={handleAddSale}>Record Sale</Button>
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  salesCard: {
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
  saleCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  saleCustomer: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  saleDetails: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  saleDate: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  saleStatus: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  statusChip: {
    marginBottom: 4,
  },
  saleAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  paymentMethod: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  saleActions: {
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
  completeButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  editButton: {
    backgroundColor: '#2563eb',
  },
  deleteButton: {
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
