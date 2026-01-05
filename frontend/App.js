import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import ProfileCreationScreen from './src/screens/profile/ProfileCreationScreen';
import DiscoveryScreen from './src/screens/discovery/DiscoveryScreen';
import MatchesScreen from './src/screens/matches/MatchesScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import DocumentsScreen from './src/screens/settings/DocumentsScreen';
import VerificationScreen from './src/screens/settings/VerificationScreen';
import DiscoverSettingsScreen from './src/screens/settings/DiscoverSettingsScreen';
import HelpScreen from './src/screens/settings/HelpScreen';
import FeedbackScreen from './src/screens/settings/FeedbackScreen';

// Import context
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// API Configuration
axios.defaults.baseURL = 'http://192.168.1.10:8080/api';

// Auth Stack Navigator
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
  </Stack.Navigator>
);

// Main App Tab Navigator
const MainTabs = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#EFE9E1',
          borderTopColor: '#D4D4D4',
          height: 60,
        },
        tabBarActiveTintColor: '#1155ccff',
        tabBarInactiveTintColor: '#7A7A7A',
        headerStyle: {
          backgroundColor: '#F7F7F7',
        },
        headerTintColor: '#4A4A4A',
      }}
    >
      <Tab.Screen 
        name="Discovery" 
        component={DiscoveryScreen}
        options={{
          tabBarLabel: 'Discover',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Matches',
          headerTitle: 'Your Matches',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={({ route }) => ({
        headerTitle: route.params.userName || 'Chat',
        headerStyle: { backgroundColor: '#F7F7F7' },
      })}
    />
    <Stack.Screen 
      name="Documents" 
      component={DocumentsScreen}
      options={{ headerTitle: 'My Documents' }}
    />
    <Stack.Screen 
      name="Verification" 
      component={VerificationScreen}
      options={{ headerTitle: 'Verification Status' }}
    />
    <Stack.Screen 
      name="DiscoverSettings" 
      component={DiscoverSettingsScreen}
      options={{ headerTitle: 'Discover Settings' }}
    />
    <Stack.Screen 
      name="Help" 
      component={HelpScreen}
      options={{ headerTitle: 'Help & Support' }}
    />
    <Stack.Screen 
      name="Feedback" 
      component={FeedbackScreen}
      options={{ headerTitle: 'Send Feedback' }}
    />
  </Stack.Navigator>
);

// Root Navigator Component
const AppNavigator = () => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check user registration step
  if (user) {
    const registrationStep = user.registrationStep || 0;
    
    // Redirect based on registration step
    switch (registrationStep) {
      case 0:
        // User just registered, need onboarding
        return (
          <NavigationContainer>
            <AuthStack />
          </NavigationContainer>
        );
      case 1:
        // Onboarding completed, need profile creation
        return (
          <NavigationContainer>
            <AuthStack />
          </NavigationContainer>
        );
      case 2:
        // Profile completed, can access main app
        return (
          <NavigationContainer>
            <MainStack />
          </NavigationContainer>
        );
      default:
        return (
          <NavigationContainer>
            <AuthStack />
          </NavigationContainer>
        );
    }
  }

  // No user, show auth stack
  return (
    <NavigationContainer>
      <AuthStack />
    </NavigationContainer>
  );
};

// Main App Component
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'System',
  },
});
