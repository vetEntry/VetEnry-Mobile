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

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email address.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError('');
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Icon name="email-check" size={64} color="#16a34a" />
          <Title style={styles.successTitle}>Check Your Email</Title>
          <Paragraph style={styles.successText}>
            We've sent password reset instructions to:
          </Paragraph>
          <Text style={styles.emailText}>{email}</Text>
          <Paragraph style={styles.successSubtext}>
            If you don't see the email, check your spam folder or try again.
          </Paragraph>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login' as never)}
              style={styles.backButton}
            >
              Back to Login
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              style={styles.resendButton}
            >
              Resend Email
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Icon name="lock-reset" size={48} color="#16a34a" />
            <Title style={styles.headerTitle}>Forgot Password?</Title>
            <Paragraph style={styles.headerSubtitle}>
              Don't worry! It happens to the best of us. Enter your email address and we'll send you instructions to reset your password.
            </Paragraph>
          </View>
        </View>

        {/* Reset Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>Reset Your Password</Title>
            <Paragraph style={styles.formSubtitle}>
              Enter the email address associated with your account
            </Paragraph>

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={handleEmailChange}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              error={!!emailError}
              left={<TextInput.Icon icon="email" />}
            />

            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !email.trim()}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Remember your password?{' '}
                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                  <Text style={styles.helpLink}>Sign in</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Additional Help */}
        <Card style={styles.helpCard}>
          <Card.Content>
            <Title style={styles.helpCardTitle}>Need Help?</Title>
            
            <View style={styles.helpItem}>
              <Icon name="email-outline" size={20} color="#6b7280" />
              <View style={styles.helpItemContent}>
                <Text style={styles.helpItemTitle}>Check Your Email</Text>
                <Text style={styles.helpItemText}>
                  Make sure to check your spam or junk folder if you don't see the email
                </Text>
              </View>
            </View>

            <View style={styles.helpItem}>
              <Icon name="clock-outline" size={20} color="#6b7280" />
              <View style={styles.helpItemContent}>
                <Text style={styles.helpItemTitle}>Wait a Few Minutes</Text>
                <Text style={styles.helpItemText}>
                  It may take a few minutes for the email to arrive
                </Text>
              </View>
            </View>

            <View style={styles.helpItem}>
              <Icon name="account-question" size={20} color="#6b7280" />
              <View style={styles.helpItemContent}>
                <Text style={styles.helpItemTitle}>Contact Support</Text>
                <Text style={styles.helpItemText}>
                  If you're still having trouble, contact our support team
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => Alert.alert('Coming Soon', 'Support contact will be available soon')}
            >
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
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
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  formCard: {
    margin: 16,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 16,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    marginBottom: 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  helpContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  helpText: {
    fontSize: 16,
    color: '#6b7280',
  },
  helpLink: {
    color: '#16a34a',
    fontWeight: '600',
  },
  helpCard: {
    margin: 16,
    elevation: 2,
  },
  helpCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  helpItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  helpItemText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 16,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 16,
    width: '100%',
  },
  backButton: {
    backgroundColor: '#16a34a',
    width: '100%',
  },
  resendButton: {
    borderColor: '#6b7280',
    width: '100%',
  },
});
