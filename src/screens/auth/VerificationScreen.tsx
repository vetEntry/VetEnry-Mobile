import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function VerificationScreen() {
  const navigation = useNavigation();
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement verification API call
      Alert.alert('Success', 'Email verified successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login' as never) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement resend code API call
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="email-check" size={80} color="#16a34a" />
        </View>

        <Title style={styles.title}>Verify Your Email</Title>
        <Paragraph style={styles.subtitle}>
          We've sent a verification code to your email address. Please enter it below to complete your registration.
        </Paragraph>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              mode="outlined"
              keyboardType="numeric"
              maxLength={6}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleVerify}
              loading={isLoading}
              disabled={isLoading}
              style={styles.verifyButton}
            >
              Verify Email
            </Button>

            <Button
              mode="text"
              onPress={handleResendCode}
              disabled={isLoading}
              style={styles.resendButton}
            >
              Resend Code
            </Button>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6b7280',
    lineHeight: 24,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  input: {
    marginBottom: 20,
  },
  verifyButton: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  resendButton: {
    marginTop: 10,
  },
});
