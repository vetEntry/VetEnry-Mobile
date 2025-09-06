import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function FinancialScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Management</Text>
        <Text style={styles.headerSubtitle}>
          Track your farm's financial performance
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.comingSoonContainer}>
            <Icon name="chart-line" size={64} color="#9ca3af" />
            <Title style={styles.comingSoonTitle}>Coming Soon</Title>
            <Paragraph style={styles.comingSoonText}>
              Financial tracking, expense management, and profit analysis features will be available in the next update.
            </Paragraph>
          </View>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  card: {
    margin: 16,
    elevation: 2,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
});
