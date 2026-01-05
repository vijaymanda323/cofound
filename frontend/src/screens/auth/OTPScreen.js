import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const OTPScreen = ({ navigation, route }) => {
  const { verifyOTP, resendOTP, isLoading, error, clearError } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [purpose, setPurpose] = useState('email_verification');

  useEffect(() => {
    // Get params from navigation
    if (route.params) {
      setIdentifier(route.params.identifier || '');
      setPurpose(route.params.purpose || 'email_verification');
    }
  }, [route.params]);

  useEffect(() => {
    // Timer for resend OTP
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = `otp-${index + 1}`;
      // This would need ref implementation for auto-focus
    }
  };

  const handleOTPKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    const result = await verifyOTP(identifier, otpCode, purpose);
    
    if (result.success) {
      clearError();
      
      // Navigate based on verification purpose and user state
      if (purpose === 'email_verification') {
        const user = result.user;
        if (user.registrationStep === 0) {
          navigation.replace('Onboarding');
        } else if (user.registrationStep === 1) {
          navigation.replace('ProfileCreation');
        } else {
          // Will be handled by AppNavigator
        }
      } else if (purpose === 'password_reset') {
        Alert.alert('Success', 'OTP verified. You can now reset your password.');
        // TODO: Navigate to password reset screen
      }
    } else {
      Alert.alert('Verification Failed', result.error);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    const result = await resendOTP(identifier, purpose);
    
    if (result.success) {
      Alert.alert('Success', 'OTP has been resent to your email');
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      setCanResend(false);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOTPInputStyle = (index) => {
    return [
      styles.otpInput,
      otp[index] ? styles.otpInputFilled : styles.otpInputEmpty,
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {identifier}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={getOTPInputStyle(index)}
                value={digit}
                onChangeText={(value) => handleOTPChange(value.replace(/[^0-9]/g, ''), index)}
                onKeyPress={(e) => handleOTPKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                secureTextEntry={false}
                autoFocus={index === 0}
                selectionColor="#1155ccff"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.disabledButton]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={!canResend}
            >
              <Text style={[styles.resendButton, !canResend && styles.disabledResend]}>
                {canResend ? 'Resend OTP' : `Resend in ${formatTimer(timer)}`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#D4D4D4',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    backgroundColor: '#FFFFFF',
  },
  otpInputEmpty: {
    borderColor: '#D4D4D4',
  },
  otpInputFilled: {
    borderColor: '#1155ccff',
    backgroundColor: '#F0F7FF',
  },
  verifyButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 8,
  },
  resendButton: {
    fontSize: 16,
    color: '#1155ccff',
    fontWeight: '600',
  },
  disabledResend: {
    color: '#7A7A7A',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#7A7A7A',
    fontWeight: '500',
  },
});

export default OTPScreen;
