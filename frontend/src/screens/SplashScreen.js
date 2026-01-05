import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { user, isLoading } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (user) {
          // User is logged in, check registration step
          if (user.registrationStep === 0) {
            navigation.replace('Onboarding');
          } else if (user.registrationStep === 1) {
            navigation.replace('ProfileCreation');
          } else {
            // User is fully registered, navigation will be handled by AppNavigator
            // This is just a fallback
          }
        } else {
          // User not logged in
          navigation.replace('Login');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isLoading, navigation, fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Found</Text>
        </View>
        
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>Find the right co-founder</Text>
        </View>

        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A4A4A',
    textAlign: 'center',
    letterSpacing: 2,
  },
  taglineContainer: {
    marginBottom: 48,
  },
  tagline: {
    fontSize: 18,
    color: '#7A7A7A',
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4D4D4',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#1155ccff',
    width: 24,
  },
});

export default SplashScreen;
