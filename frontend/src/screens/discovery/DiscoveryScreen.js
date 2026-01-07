import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { DUMMY_PROFILES } from '../../data/dummyData';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DiscoverScreen = ({ navigation }) => {
  const { user } = useAuth();
  const position = useRef(new Animated.ValueXY()).current;
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingNext, setFetchingNext] = useState(false);

  useEffect(() => {
    fetchNextProfile();
  }, []);

  const fetchNextProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get('/discovery/next');
      if (res.data.profile) {
        setCurrentProfile(res.data.profile);
      } else {
        // Fallback to dummy data
        const randomIndex = Math.floor(Math.random() * DUMMY_PROFILES.length);
        setCurrentProfile(DUMMY_PROFILES[randomIndex]);
      }
    } catch (error) {
      console.error('Error fetching next profile:', error);
      // Fallback to dummy data on error too
      const randomIndex = Math.floor(Math.random() * DUMMY_PROFILES.length);
      setCurrentProfile(DUMMY_PROFILES[randomIndex]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- PAN RESPONDER ---------- */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) swipeRight();
        else if (gesture.dx < -120) swipeLeft();
        else resetPosition();
      },
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  /* ---------- ACTIONS ---------- */
  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeAction('like');
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      handleSwipeAction('pass');
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const handleSwipeAction = async (action) => {
    if (!currentProfile) return;

    const actionValue = action === 'like' ? 'yes' : 'no';
    const profileId = currentProfile.userId?._id || currentProfile.userId;

    // If it's a dummy profile, don't call the backend
    if (typeof profileId === 'string' && profileId.startsWith('user')) {
      console.log('Skipping backend action for dummy profile:', profileId);
      nextProfile();
      return;
    }

    try {
      const res = await API.post(`/discovery/action?profileId=${profileId}&action=${actionValue}`);

      if (res.data.match) {
        Alert.alert(
          `Connection established with ${currentProfile.fullName}`,
          `You and ${currentProfile.fullName} can now start a conversation`
        );
      }
    } catch (error) {
      console.error('Error handling swipe:', error);
    }

    nextProfile();
  };

  const nextProfile = () => {
    position.setValue({ x: 0, y: 0 });
    fetchNextProfile();
  };


  if (loading && !currentProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1155ccff" />
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.filtersBtn}
            onPress={() => navigation.navigate('Filters')}
          >
            <Ionicons name="options-outline" size={20} color="#FFF" />
            <Text style={styles.filtersBtnText}>Filters</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>FOUND.</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Profiles Found</Text>

            <Text style={styles.emptySubtitle}>
              Try Expanding your filters
            </Text>

            <Text style={styles.emptyOr}>OR</Text>

            <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
              <Text style={styles.emptyUpgrade}>
                {user?.plan === 'Pro'
                  ? 'Upgrade to Founder\'s Club'
                  : 'Upgrade to Pro/ Founder\'s Club'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Filters')}>
          <Ionicons name="options-outline" size={28} color="#1155ccff" />
        </TouchableOpacity>
        <Text style={styles.logo}>FOUND.</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cardsContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              transform: [
                ...position.getTranslateTransform(),
                { rotate: rotate }
              ]
            },
          ]}
        >
          {currentProfile.profilePhoto ? (
            <Image
              source={{ uri: currentProfile.profilePhoto }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={{ fontSize: 60 }}>👤</Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.name}>
              {currentProfile.fullName}, {currentProfile.location.address.split(',')[0]}
            </Text>
            <Text style={styles.sub}>
              {currentProfile.role || 'Entrepreneur'} • {currentProfile.education?.degree || ''} {currentProfile.education?.field || ''}
            </Text>

            <ScrollView style={styles.bioScroll}>
              <Text style={styles.text}>{currentProfile.bio || currentProfile.mission}</Text>

              {currentProfile.equityRange && (
                <>
                  <Text style={styles.section}>Equity Range</Text>
                  <Text style={styles.text}>{currentProfile.equityRange}</Text>
                </>
              )}

              <Text style={styles.section}>Goal</Text>
              <Text style={styles.text}>{currentProfile.goal}</Text>

              <Text style={styles.section}>Skills</Text>
              <View style={styles.skillsContainer}>
                {currentProfile.skills?.map((skill, idx) => (
                  <View key={idx} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill.name}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.distance}>
                  {currentProfile.distance} km away
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProfileDetail', { profile: currentProfile })}
                >
                  <Text style={styles.detailsBtn}>View Details</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.pass} onPress={swipeLeft}>
          <Ionicons name="close" size={35} color="#FF5A5F" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.like} onPress={swipeRight}>
          <Ionicons name="checkmark" size={35} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontWeight: '900',
    fontSize: 18,
    color: '#000',
    letterSpacing: 1,
  },
  headerLink: {
    color: '#6E7BFF',
    fontWeight: '600',
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '50%',
    borderRadius: 20,
    backgroundColor: '#F0F1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarImage: {
    width: '100%',
    height: '50%',
    borderRadius: 20,
    marginBottom: 15,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  skillChip: {
    backgroundColor: '#F0F1F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  skillChipText: {
    fontSize: 12,
    color: '#333',
  },
  infoCard: {
    flex: 1,
    width: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1E2D',
  },
  sub: {
    fontSize: 16,
    color: '#6F6F85',
    marginBottom: 15,
  },
  bioScroll: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    color: '#1E1E2D',
    lineHeight: 22,
    marginBottom: 15,
  },
  section: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1E1E2D',
    marginTop: 10,
    marginBottom: 5,
  },
  link: {
    color: '#6E7BFF',
    marginTop: 10,
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F6',
  },
  distance: {
    color: '#6F6F85',
    fontSize: 12,
  },
  detailsBtn: {
    color: '#1155ccff',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingVertical: 30,
  },
  pass: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF5A5F',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  like: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 30,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
  },
  emptyOr: {
    fontSize: 18,
    color: '#333',
    marginVertical: 5,
    fontWeight: '600',
  },
  emptyUpgrade: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '600',
  },
  filtersBtn: {
    backgroundColor: '#1E1E4D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  filtersBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default DiscoverScreen;
