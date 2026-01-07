import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [documentStats, setDocumentStats] = useState(null);
  const [matchCount, setMatchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(true);
  const [isRewriting, setIsRewriting] = useState(false);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setIsLoading(true);

      const [profileRes, verificationRes, docsRes, matchStatsRes] = await Promise.all([
        API.get('/profile/me'),
        API.get('/settings/verification'),
        API.get('/documents/stats/overview'),
        API.get('/matches/stats/overview'),
      ]);

      setProfile(profileRes.data.profile);
      setVerificationStatus(verificationRes.data.verificationStatus);
      setDocumentStats(docsRes.data.stats);
      setMatchCount(matchStatsRes.data.stats?.totalMatches || 0);
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiRewrite = () => {
    setIsRewriting(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsRewriting(false);
      Alert.alert('AI Rewrite', 'Your pitch has been polished! (This is a preview of the AI feature)');
    }, 2000);
  };

  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit', { initialProfile: profile });
  };

  const handleLogout = () => {
    setShowSettingsMenu(false);
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

  const renderSettingsMenu = () => (
    <Modal
      visible={showSettingsMenu}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSettingsMenu(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSettingsMenu(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowSettingsMenu(false); navigation.navigate('Documents'); }}
          >
            <Text style={styles.menuItemText}>✓ My Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowSettingsMenu(false); navigation.navigate('Verification'); }}
          >
            <Text style={styles.menuItemText}>✓ Verification Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowSettingsMenu(false); navigation.navigate('Filters'); }}
          >
            <Text style={styles.menuItemText}>✓ Discover Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowSettingsMenu(false); navigation.navigate('Subscription'); }}
          >
            <Text style={styles.menuItemText}>✓ Membership & Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowSettingsMenu(false); navigation.navigate('Help'); }}
          >
            <Text style={styles.menuItemText}>✓ Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowSettingsMenu(false); navigation.navigate('Feedback'); }}
          >
            <Text style={styles.menuItemText}>✓ Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <Text style={styles.menuItemText}>✓ Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerLogo}>FOUND.</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setShowSettingsMenu(true)}
        >
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadSettingsData} tintColor="#1155ccff" />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarMainContainer}>
            <View style={styles.avatarCircle}>
              {profile?.profilePhoto ? (
                <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={50} color="#CCC" />
                </View>
              )}
              <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEditProfile}>
                <Ionicons name="pencil" size={16} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>
              {profile?.fullName || profile?.name || user?.fullName || user?.email?.split('@')[0] || 'User Name'}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#1155ccff" />
              <Text style={styles.locationText}>
                {profile?.location?.address ||
                  (profile?.location?.city && profile?.location?.country
                    ? `${profile.location.city}, ${profile.location.country}`
                    : profile?.location?.city ||
                    profile?.location?.country ||
                    'Location not set')}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <Ionicons name="trending-up-outline" size={20} color="#2ECC71" />
              </View>
              <Text style={styles.statLabel}>MATCHES</Text>
              <Text style={styles.statValue}>{matchCount}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F0F7FF' }]}>
                <Ionicons name="people-outline" size={20} color="#3498DB" />
              </View>
              <Text style={styles.statLabel}>PROFILE VIEWS</Text>
              <Text style={styles.statValue}>{profile?.viewCount || 0}</Text>
            </View>
          </View>

          {/* Quick Pitch */}
          <View style={styles.quickPitchContainer}>
            <View style={styles.quickPitchHeader}>
              <Text style={styles.sectionHeaderTitle}>QUICK PITCH</Text>
              <TouchableOpacity
                style={[styles.aiRewrite, isRewriting && { opacity: 0.5 }]}
                onPress={handleAiRewrite}
                disabled={isRewriting}
              >
                {isRewriting ? (
                  <ActivityIndicator size="small" color="#3498DB" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={14} color="#3498DB" />
                    <Text style={styles.aiRewriteText}> AI Rewrite</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.pitchCard}>
              <Text style={styles.pitchText}>
                {profile?.bio || profile?.mission || 'Building the future one step at a time. Looking for like-minded individuals to join the journey.'}
              </Text>
            </View>
          </View>

          {/* Deep Dive Section */}
          <View style={styles.deepDiveContainer}>
            <View style={styles.deepDiveHeader}>
              <Text style={styles.sectionHeaderTitle}>Deep Dive</Text>
              <TouchableOpacity onPress={() => setShowDeepDive(!showDeepDive)}>
                <Text style={styles.hideText}>{showDeepDive ? 'HIDE' : 'SHOW'}</Text>
              </TouchableOpacity>
            </View>

            {showDeepDive && (
              <>
                {/* The Vision */}
                <View style={[styles.diveCard, styles.visionCard]}>
                  <View style={styles.diveHeaderRow}>
                    <View style={[styles.diveIconBox, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="leaf-outline" size={20} color="#2ECC71" />
                    </View>
                    <Text style={styles.diveTitle}>THE VISION</Text>
                  </View>
                  <Text style={styles.diveQuote}>
                    "{profile?.mission || 'I want to create a platform to bring right minded people together who can build a great value together.'}"
                  </Text>
                </View>

                {/* The Journey */}
                <View style={[styles.diveCard, styles.journeyCard]}>
                  <View style={styles.diveHeaderRow}>
                    <View style={[styles.diveIconBox, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="time-outline" size={20} color="#3498DB" />
                    </View>
                    <Text style={styles.diveTitle}>THE JOURNEY</Text>
                  </View>
                  <Text style={styles.journeyText}>
                    {profile?.role || 'Entrepreneur'}
                    {profile?.industries?.length > 0 ? `, ${profile.industries.join(', ')}` : ''}
                  </Text>
                </View>

                {/* Experience */}
                <View style={[styles.diveCard, styles.experienceCard]}>
                  <View style={styles.diveHeaderRow}>
                    <View style={[styles.diveIconBox, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="briefcase-outline" size={20} color="#F39C12" />
                    </View>
                    <Text style={styles.diveTitle}>EXPERIENCE</Text>
                  </View>
                  <View style={styles.experienceRow}>
                    <View style={styles.expInfo}>
                      <Text style={styles.expValue}>{profile?.experience || '1'} Years</Text>
                      <Text style={styles.expSub}>IN INDUSTRY</Text>
                    </View>
                    {profile?.isVerified && (
                      <View style={styles.verifiedProBadge}>
                        <Text style={styles.verifiedProText}>VERIFIED PRO</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderSettingsMenu()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarMainContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#F9F9F9',
    position: 'relative',
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    right: -10,
    bottom: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (SCREEN_WIDTH - 55) / 2,
    backgroundColor: '#FDFDFD',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  quickPitchContainer: {
    marginBottom: 30,
  },
  quickPitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  aiRewrite: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiRewriteText: {
    fontSize: 12,
    color: '#3498DB',
    fontWeight: '600',
  },
  pitchCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pitchText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  deepDiveContainer: {
    marginBottom: 20,
  },
  deepDiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  hideText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
  },
  diveCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  visionCard: {
    backgroundColor: '#FDFDFD',
    borderLeftWidth: 5,
    borderLeftColor: '#2ECC71',
  },
  journeyCard: {
    backgroundColor: '#FDFDFD',
    borderLeftWidth: 5,
    borderLeftColor: '#3498DB',
  },
  experienceCard: {
    backgroundColor: '#FDFDFD',
    borderLeftWidth: 5,
    borderLeftColor: '#F39C12',
  },
  diveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  diveIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  diveTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 0.5,
  },
  diveQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#333',
    lineHeight: 24,
    fontWeight: '500',
  },
  journeyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
  },
  expSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
  },
  verifiedProBadge: {
    backgroundColor: '#FDF2E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F39C12',
  },
  verifiedProText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F39C12',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '75%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default SettingsScreen;
