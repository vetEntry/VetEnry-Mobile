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
import { Card, Title, Paragraph, Button, Switch, List, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout logic
            navigation.navigate('Login' as never);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion logic
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Settings</Title>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* App Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>App Settings</Title>
            
            <List.Item
              title="Notifications"
              description="Receive push notifications for important updates"
              left={() => <Icon name="bell" size={24} color="#6b7280" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Dark Mode"
              description="Use dark theme for the app"
              left={() => <Icon name="theme-light-dark" size={24} color="#6b7280" />}
              right={() => (
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Auto Sync"
              description="Automatically sync data when online"
              left={() => <Icon name="sync" size={24} color="#6b7280" />}
              right={() => (
                <Switch
                  value={autoSyncEnabled}
                  onValueChange={setAutoSyncEnabled}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Location Tracking"
              description="Allow location tracking for farm data"
              left={() => <Icon name="map-marker" size={24} color="#6b7280" />}
              right={() => (
                <Switch
                  value={locationTrackingEnabled}
                  onValueChange={setLocationTrackingEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Account</Title>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="account-edit" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Edit Profile</Text>
                  <Text style={styles.settingDescription}>Update your personal information</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <Divider />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="lock-reset" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Change Password</Text>
                  <Text style={styles.settingDescription}>Update your account password</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <Divider />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="email" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Email Preferences</Text>
                  <Text style={styles.settingDescription}>Manage email notifications</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Data & Privacy */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Data & Privacy</Title>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="download" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Export Data</Text>
                  <Text style={styles.settingDescription}>Download your farm data</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <Divider />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="database-remove" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Clear Cache</Text>
                  <Text style={styles.settingDescription}>Clear app cache and temporary data</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <Divider />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="shield-account" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Privacy Policy</Text>
                  <Text style={styles.settingDescription}>View our privacy policy</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Support */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Support</Title>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="help-circle" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Help Center</Text>
                  <Text style={styles.settingDescription}>Get help and support</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <Divider />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="message-text" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Contact Support</Text>
                  <Text style={styles.settingDescription}>Get in touch with our team</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <Divider />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="star" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Rate App</Text>
                  <Text style={styles.settingDescription}>Rate us on the app store</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>About</Title>
            
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            
            <Divider />
            
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Build Number</Text>
              <Text style={styles.aboutValue}>100</Text>
            </View>
            
            <Divider />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Icon name="information" size={24} color="#6b7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Terms of Service</Text>
                  <Text style={styles.settingDescription}>View terms and conditions</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.sectionCard, styles.dangerCard]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Title>
            
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.dangerButton}
              textColor="#dc2626"
            >
              Logout
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={[styles.dangerButton, styles.deleteButton]}
              textColor="#dc2626"
            >
              Delete Account
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
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
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  aboutValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  dangerCard: {
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#dc2626',
  },
  dangerButton: {
    marginBottom: 10,
    borderColor: '#dc2626',
  },
  deleteButton: {
    marginBottom: 0,
  },
});
