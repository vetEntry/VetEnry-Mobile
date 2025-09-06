import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Import screens
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import VerificationScreen from './src/screens/auth/VerificationScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';

// Farmer screens
import FarmerDashboard from './src/screens/farmer/FarmerDashboard';

import FlockManagementScreen from './src/screens/farmer/FlockManagementScreen';
import BreedManagementScreen from './src/screens/farmer/BreedManagementScreen';
import FinancialScreen from './src/screens/farmer/FinancialScreen';
import WorkerManagementScreen from './src/screens/farmer/WorkerManagementScreen';
import SalesScreen from './src/screens/farmer/SalesScreen';
import MarketplaceScreen from './src/screens/farmer/MarketplaceScreen';
import TasksScreen from './src/screens/farmer/TasksScreen';

// Farm Worker screens
import WorkerDashboard from './src/screens/worker/WorkerDashboard';
import DataEntryScreen from './src/screens/worker/DataEntryScreen';
import FlockOverviewScreen from './src/screens/worker/FlockOverviewScreen';
import ReportsScreen from './src/screens/worker/ReportsScreen';

// Veterinarian screens
import VetDashboard from './src/screens/vet/VetDashboard';
import ConsultationsScreen from './src/screens/vet/ConsultationsScreen';
import HealthAlertsScreen from './src/screens/vet/HealthAlertsScreen';

// Common screens
import ProfileScreen from './src/screens/common/ProfileScreen';
import SettingsScreen from './src/screens/common/SettingsScreen';
import NotificationsScreen from './src/screens/common/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Farmer Tab Navigator
function FarmerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Farm & Flock') {
            iconName = 'egg';
          } else if (route.name === 'Financial') {
            iconName = 'currency-usd';
          } else if (route.name === 'Workers') {
            iconName = 'account-group';
          } else if (route.name === 'Sales') {
            iconName = 'cart';
          } else if (route.name === 'Marketplace') {
            iconName = 'store';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={FarmerDashboard} />
      <Tab.Screen name="Farm & Flock" component={FlockManagementScreen} />
      <Tab.Screen name="Financial" component={FinancialScreen} />
      <Tab.Screen name="Workers" component={WorkerManagementScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
    </Tab.Navigator>
  );
}

// Farm Worker Tab Navigator
function WorkerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Data Entry') {
            iconName = 'database-plus';
          } else if (route.name === 'Flocks') {
            iconName = 'egg';
          } else if (route.name === 'Reports') {
            iconName = 'chart-line';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={WorkerDashboard} />
      <Tab.Screen name="Data Entry" component={DataEntryScreen} />
      <Tab.Screen name="Flocks" component={FlockOverviewScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

// Veterinarian Tab Navigator
function VetTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Consultations') {
            iconName = 'stethoscope';
          } else if (route.name === 'Health Alerts') {
            iconName = 'alert-circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={VetDashboard} />
      <Tab.Screen name="Consultations" component={ConsultationsScreen} />
      <Tab.Screen name="Health Alerts" component={HealthAlertsScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth Stack */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      
      {/* Main App Stacks */}
      <Stack.Screen name="FarmerApp" component={FarmerTabNavigator} />
      <Stack.Screen name="WorkerApp" component={WorkerTabNavigator} />
      <Stack.Screen name="VetApp" component={VetTabNavigator} />
      
      {/* Common Screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
