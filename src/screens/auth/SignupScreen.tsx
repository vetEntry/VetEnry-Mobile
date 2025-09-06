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
import { TextInput, Button, Title, Paragraph, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'FARMER' as 'FARMER' | 'WORKER' | 'VETERINARIAN',
    farmName: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    farmName: '',
  });

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      farmName: '',
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'FARMER' && !formData.farmName.trim()) {
      newErrors.farmName = 'Farm name is required for farmers';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    if (!formData.acceptTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Account created successfully! Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'FARMER': return 'Manage your farms, flocks, and business operations';
      case 'WORKER': return 'Record daily farm activities and data entry';
      case 'VETERINARIAN': return 'Provide health services and consultations';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="farm" size={48} color="#16a34a" />
          <Title style={styles.appTitle}>VetEntryAI</Title>
          <Paragraph style={styles.appSubtitle}>
            Smart farming management platform
          </Paragraph>
        </View>

        {/* Signup Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>Create Account</Title>
            <Paragraph style={styles.formSubtitle}>
              Join thousands of farmers managing their operations efficiently
            </Paragraph>

            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.row}>
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  error={!!errors.firstName}
                />
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  error={!!errors.lastName}
                />
              </View>

              <TextInput
                label="Email Address"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                error={!!errors.email}
              />

              <TextInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                error={!!errors.phone}
              />
            </View>

            {/* Role Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Your Role</Text>
              
              {(['FARMER', 'WORKER', 'VETERINARIAN'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    formData.role === role && styles.selectedRoleOption
                  ]}
                  onPress={() => updateFormData('role', role)}
                >
                  <View style={styles.roleContent}>
                    <Icon
                      name={
                        role === 'FARMER' ? 'farm' :
                        role === 'WORKER' ? 'account-hard-hat' : 'stethoscope'
                      }
                      size={24}
                      color={formData.role === role ? '#16a34a' : '#6b7280'}
                    />
                    <View style={styles.roleInfo}>
                      <Text style={[
                        styles.roleTitle,
                        formData.role === role && styles.selectedRoleTitle
                      ]}>
                        {role === 'FARMER' ? 'Farmer' :
                         role === 'WORKER' ? 'Farm Worker' : 'Veterinarian'}
                      </Text>
                      <Text style={[
                        styles.roleDescription,
                        formData.role === role && styles.selectedRoleDescription
                      ]}>
                        {getRoleDescription(role)}
                      </Text>
                    </View>
                  </View>
                  {formData.role === role && (
                    <Icon name="check-circle" size={24} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Farm Information (for Farmers) */}
            {formData.role === 'FARMER' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Farm Information</Text>
                
                <TextInput
                  label="Farm Name"
                  value={formData.farmName}
                  onChangeText={(text) => updateFormData('farmName', text)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.farmName}
                />
              </View>
            )}

            {/* Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Security</Text>
              
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                mode="outlined"
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                error={!!errors.password}
              />

              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                style={styles.input}
                error={!!errors.confirmPassword}
              />
            </View>

            {/* Terms and Conditions */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => updateFormData('acceptTerms', !formData.acceptTerms)}
              >
                <Icon
                  name={formData.acceptTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={formData.acceptTerms ? '#16a34a' : '#6b7280'}
                />
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Display */}
            {Object.values(errors).some(error => error) && (
              <View style={styles.errorsContainer}>
                {Object.entries(errors).map(([field, error]) => 
                  error ? (
                    <Text key={field} style={styles.errorText}>
                      • {error}
                    </Text>
                  ) : null
                )}
              </View>
            )}

            {/* Signup Button */}
            <Button
              mode="contained"
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
              style={styles.signupButton}
              contentStyle={styles.signupButtonContent}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                  <Text style={styles.loginLink}>Sign in</Text>
                </TouchableOpacity>
              </Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formCard: {
    margin: 16,
    elevation: 2,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  selectedRoleOption: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleInfo: {
    marginLeft: 16,
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedRoleTitle: {
    color: '#16a34a',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  selectedRoleDescription: {
    color: '#16a34a',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  termsLink: {
    color: '#16a34a',
    fontWeight: '600',
  },
  errorsContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 4,
  },
  signupButton: {
    backgroundColor: '#16a34a',
    marginBottom: 16,
  },
  signupButtonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#6b7280',
  },
  loginLink: {
    color: '#16a34a',
    fontWeight: '600',
  },
});
