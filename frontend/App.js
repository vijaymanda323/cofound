import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import ProfileCreationScreen from './src/screens/profile/ProfileCreationScreen';
import DiscoveryScreen from './src/screens/discovery/DiscoveryScreen';
import MatchesScreen from './src/screens/matches/MatchesScreen';
import ChatListScreen from './src/screens/chat/ChatListScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import ProfileDetailScreen from './src/screens/discovery/ProfileDetailScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import DocumentsScreen from './src/screens/settings/DocumentsScreen';
import VerificationScreen from './src/screens/settings/VerificationScreen';
import DiscoverSettingsScreen from './src/screens/settings/DiscoverSettingsScreen';
import HelpScreen from './src/screens/settings/HelpScreen';
import FeedbackScreen from './src/screens/settings/FeedbackScreen';
import ProfileEditScreen from './src/screens/settings/ProfileEditScreen';
import SubscriptionScreen from './src/screens/settings/SubscriptionScreen';
// New onboarding screens
import GoalSelectionScreen from './src/screens/onboarding/GoalSelectionScreen';
import RoleSelectionScreen from './src/screens/onboarding/RoleSelectionScreen';
import FiltersScreen from './src/screens/discovery/FiltersScreen';

// Import context
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { OnboardingProvider } from './src/context/OnboardingContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
    <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
  </Stack.Navigator>
);

// Main App Tab Navigator
const MainTabs = () => {
  const { user } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Discovery') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={focused && route.name === 'Discovery' ? styles.activeIconBg : null}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#1155cc',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          marginTop: -4,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#000000',
      })}
    >
      <Tab.Screen
        name="Discovery"
        component={DiscoveryScreen}
        options={{
          tabBarLabel: 'DISCOVER',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarLabel: 'MATCHES',
          headerTitle: 'Your Matches',
          headerTitleAlign: 'center',
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'CHAT',
          headerTitle: 'Chats',
          headerTitleAlign: 'center',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'PROFILE',
          headerTitle: 'MY PROFILE',
          headerShown: false,
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
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProfileDetail"
      component={ProfileDetailScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Documents"
      component={DocumentsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Verification"
      component={VerificationScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="DiscoverSettings"
      component={DiscoverSettingsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Help"
      component={HelpScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Feedback"
      component={FeedbackScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Filters"
      component={FiltersScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProfileEdit"
      component={ProfileEditScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Subscription"
      component={SubscriptionScreen}
      options={{ headerShown: false }}
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
        // Onboarding started, continue onboarding flow
        return (
          <NavigationContainer>
            <AuthStack />
          </NavigationContainer>
        );
      case 2:
        // Onboarding completed, can access main app
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <OnboardingProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
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
  activeIconBg: {
    backgroundColor: 'rgba(110, 123, 255, 0.1)',
    padding: 8,
    borderRadius: 12,
  },
});
