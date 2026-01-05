import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanGestureHandler,
  Dimensions,
  Alert,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = height * 0.75;

const DiscoveryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [showNoProfiles, setShowNoProfiles] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const lastSwipeDirection = useRef(null);

  useEffect(() => {
    loadNextProfile();
  }, []);

  const loadNextProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/discovery/next');
      
      if (response.data.profile) {
        setProfiles([response.data.profile]);
        setCurrentProfileIndex(0);
        setShowNoProfiles(false);
      } else {
        setProfiles([]);
        setShowNoProfiles(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setShowNoProfiles(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (currentProfileIndex >= profiles.length) return;

    const currentProfile = profiles[currentProfileIndex];
    const action = direction === 'right' ? 'yes' : 'no';

    try {
      const response = await axios.post(`/discovery/action?profileId=${currentProfile.userId}&action=${action}`);
      
      if (response.data.match) {
        // Match found!
        setMatchData(response.data.matchData);
        setShowMatchModal(true);
      }

      // Animate card out
      Animated.spring(translateX, {
        toValue: direction === 'right' ? width + 100 : -width - 100,
        useNativeDriver: true,
      }).start(() => {
        // Reset animation
        translateX.setValue(0);
        rotate.setValue(0);
        
        // Move to next profile
        if (currentProfileIndex < profiles.length - 1) {
          setCurrentProfileIndex(currentProfileIndex + 1);
        } else {
          loadNextProfile();
        }
      });
    } catch (error) {
      console.error('Error handling swipe:', error);
      Alert.alert('Error', 'Failed to process swipe');
    }
  };

  const handlePanGesture = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const handlePanGestureEnd = (event) => {
    const { translationX } = event.nativeEvent;
    
    if (Math.abs(translationX) > SWIPE_THRESHOLD) {
      const direction = translationX > 0 ? 'right' : 'left';
      handleSwipe(direction);
    } else {
      // Snap back to center
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const rotateInterpolate = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const handleYes = () => {
    handleSwipe('right');
  };

  const handleNo = () => {
    handleSwipe('left');
  };

  const handleMatchModalClose = () => {
    setShowMatchModal(false);
    setMatchData(null);
    loadNextProfile();
  };

  const handleOpenChat = () => {
    if (matchData) {
      setShowMatchModal(false);
      navigation.navigate('Chat', { 
        matchId: matchData.id, 
        userName: matchData.user.fullName 
      });
    }
  };

  const handleExpandFilters = () => {
    navigation.navigate('DiscoverSettings');
  };

  const renderProfileCard = (profile, index) => {
    if (!profile) return null;

    const isCurrentCard = index === currentProfileIndex;
    const nextCardScale = isCurrentCard ? 1 : 0.95;
    const nextCardOpacity = isCurrentCard ? 1 : 0.8;

    return (
      <Animated.View
        key={profile._id}
        style={[
          styles.card,
          {
            transform: [
              { translateX: isCurrentCard ? translateX : 0 },
              { rotate: isCurrentCard ? rotateInterpolate : '0deg' },
              { scale: nextCardScale },
            ],
            opacity: nextCardOpacity,
            zIndex: profiles.length - index,
          },
        ]}
      >
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          {profile.profilePhoto ? (
            <Image source={{ uri: profile.profilePhoto }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>👤</Text>
            </View>
          )}
        </View>

        {/* Profile Info Overlay */}
        <View style={styles.profileOverlay}>
          <View style={styles.profileHeader}>
            <View>
              <Text style={styles.profileName}>{profile.fullName || 'Anonymous'}</Text>
              <Text style={styles.profileAge}>
                {profile.yearOfBirth ? `${new Date().getFullYear() - profile.yearOfBirth}` : 'Age unknown'}
              </Text>
            </View>
            <TouchableOpacity style={styles.infoButton}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        {isCurrentCard && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => handleSkip()}
            >
              <Text style={styles.skipIcon}>✕</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => handleLike()}
            >
              <Text style={styles.likeIcon}>❤️</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.superLikeButton}
              onPress={() => handleSuperLike()}
            >
              <Text style={styles.superLikeIcon}>⭐</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  const handleSkip = () => {
    Animated.spring(translateX, {
      toValue: -width,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeAction('skip');
    });
  };

  const handleLike = () => {
    Animated.spring(translateX, {
      toValue: width,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeAction('like');
    });
  };

  const handleSuperLike = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeAction('superlike');
    });
  };

  const handleSwipeAction = async (action) => {
    if (currentProfileIndex >= profiles.length) return;

    const currentProfile = profiles[currentProfileIndex];
    
    try {
      const response = await axios.post(`/discovery/action?profileId=${currentProfile.userId}&action=${action}`);
      
      if (response.data.match) {
        setMatchData(response.data.matchData);
        setShowMatchModal(true);
      }

      // Reset animation
      translateX.setValue(0);
      rotate.setValue(0);
      
      // Move to next profile
      if (currentProfileIndex < profiles.length - 1) {
        setCurrentProfileIndex(currentProfileIndex + 1);
      } else {
        loadNextProfile();
      }
    } catch (error) {
      console.error('Error handling swipe:', error);
      Alert.alert('Error', 'Failed to process swipe');
    }
  };

  if (showNoProfiles) {
    return (
      <View style={styles.container}>
        <View style={styles.noProfilesContainer}>
          <Text style={styles.noProfilesTitle}>No Profiles Found</Text>
          <Text style={styles.noProfilesSubtitle}>
            Try expanding your filters or check back later
          </Text>
          <TouchableOpacity
            style={styles.expandFiltersButton}
            onPress={handleExpandFilters}
          >
            <Text style={styles.expandFiltersText}>Expand Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.filterButton} onPress={handleExpandFilters}>
          <Text style={styles.filterButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        {profiles.map((profile, index) => (
          <PanGestureHandler
            key={profile._id}
            onGestureEvent={index === currentProfileIndex ? handlePanGesture : null}
            onHandlerStateChange={index === currentProfileIndex ? handlePanGestureEnd : null}
          >
            {renderProfileCard(profile, index)}
          </PanGestureHandler>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.noButton} onPress={handleNo}>
          <Text style={styles.noButtonText}>✖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.yesButton} onPress={handleYes}>
          <Text style={styles.yesButtonText}>✔</Text>
        </TouchableOpacity>
      </View>

      {/* Match Modal */}
      <Modal
        visible={showMatchModal}
        transparent
        animationType="slide"
        onRequestClose={handleMatchModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchModalContent}>
            <View style={styles.matchIconContainer}>
              <Text style={styles.matchIcon}>🎉</Text>
            </View>
            
            <Text style={styles.matchTitle}>Connection Established!</Text>
            
            {matchData && (
              <View style={styles.matchInfo}>
                <Text style={styles.matchName}>{matchData.user.fullName}</Text>
                <Text style={styles.matchTime}>
                  Connected {new Date(matchData.matchedAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={styles.matchActions}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleMatchModalClose}
              >
                <Text style={styles.continueButtonText}>Continue Swiping</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.chatButton}
                onPress={handleOpenChat}
              >
                <Text style={styles.chatButtonText}>Start Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  filterButton: {
    padding: 8,
  },
  filterButtonText: {
    fontSize: 20,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  placeholderText: {
    fontSize: 60,
    color: '#D0D0D0',
  },
  profileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    paddingBottom: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileAge: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  skipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  skipIcon: {
    fontSize: 24,
    color: '#FF6B6B',
  },
  likeButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  likeIcon: {
    fontSize: 32,
    color: '#FF6B6B',
  },
  superLikeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  superLikeIcon: {
    fontSize: 24,
    color: '#4ECDC4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  profileLocation: {
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: '#00b000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  photoContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  photoPlaceholderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  photoPlaceholder: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: '#D4D4D4',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#1155ccff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  skillLevel: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  industriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  industryBadge: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  industryText: {
    color: '#4A4A4A',
    fontSize: 12,
    fontWeight: '500',
  },
  swipeIndicators: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  swipeIndicator: {
    padding: 12,
    borderRadius: 50,
    minWidth: 80,
    alignItems: 'center',
  },
  yesIndicator: {
    backgroundColor: '#00b000',
  },
  noIndicator: {
    backgroundColor: '#ff4444',
  },
  swipeIndicatorText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 60,
    paddingVertical: 20,
  },
  yesButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00b000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yesButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noProfilesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noProfilesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 16,
    textAlign: 'center',
  },
  noProfilesSubtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  expandFiltersButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  expandFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  matchIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFE9E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  matchIcon: {
    fontSize: 40,
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 16,
    textAlign: 'center',
  },
  matchInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  matchActions: {
    width: '100%',
    gap: 12,
  },
  continueButton: {
    borderWidth: 1,
    borderColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#1155ccff',
    fontSize: 16,
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DiscoveryScreen;
