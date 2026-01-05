import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [documentStats, setDocumentStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setIsLoading(true);
      
      const [profileRes, verificationRes, docsRes] = await Promise.all([
        axios.get('/profile/me'),
        axios.get('/settings/verification'),
        axios.get('/documents/stats/overview'),
      ]);

      setProfile(profileRes.data.profile);
      setVerificationStatus(verificationRes.data.verificationStatus);
      setDocumentStats(docsRes.data.stats);
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete('/settings/account');
              await logout();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const renderSettingsItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <Text style={styles.settingsIcon}>{icon}</Text>
        <View style={styles.settingsItemContent}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  const renderSection = (title, items) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionItems}>
        {items.map((item, index) => (
          renderSettingsItem({ key: index, ...item })
        ))}
      </View>
    </View>
  );

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadSettingsData} />
      }
    >
      {/* Profile Section */}
      {profile && (
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profilePhoto}>
              {profile.profilePhoto ? (
                <Text style={styles.photoText}>📷</Text>
              ) : (
                <Text style={styles.avatarText}>
                  {profile.fullName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.verifiedBadge}>
                {profile.isVerified && (
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Account Section */}
      {renderSection('Account', [
        {
          icon: '📁',
          title: 'My Documents',
          subtitle: documentStats ? `${documentStats.totalDocuments} documents` : 'Manage your files',
          onPress: () => navigation.navigate('Documents'),
        },
        {
          icon: '✅',
          title: 'Verification Status',
          subtitle: verificationStatus?.isVerified ? 'Verified' : 'Not verified',
          onPress: () => navigation.navigate('Verification'),
        },
        {
          icon: '🔍',
          title: 'Discover Settings',
          subtitle: 'Manage your discovery preferences',
          onPress: () => navigation.navigate('DiscoverSettings'),
        },
      ])}

      {/* Support Section */}
      {renderSection('Help & Support', [
        {
          icon: '💬',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          onPress: () => navigation.navigate('Help'),
        },
        {
          icon: '📝',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          onPress: () => navigation.navigate('Feedback'),
        },
      ])}

      {/* Actions Section */}
      {renderSection('Actions', [
        {
          icon: '🚪',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          onPress: handleLogout,
          showArrow: false,
        },
        {
          icon: '🗑️',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          onPress: handleDeleteAccount,
          showArrow: false,
        },
      ])}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>Found</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appTagline}>Find the right co-founder</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  profileSection: {
    backgroundColor: '#EFE9E1',
    padding: 20,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  photoText: {
    fontSize: 20,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 8,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#00b000',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionItems: {
    backgroundColor: '#FFFFFF',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  arrow: {
    fontSize: 20,
    color: '#7A7A7A',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#7A7A7A',
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
