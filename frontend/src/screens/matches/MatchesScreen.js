import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import API from '../../services/api';
import { socket } from '../../services/socket';
import { DUMMY_MATCHES } from '../../data/dummyData';

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const fetchMatches = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await API.get('/match');
      // Filter to show only matches WITHOUT messages (new connections)
      const newMatches = (res.data.matches || []).filter(match => !match.lastMessage);

      if (newMatches.length > 0) {
        setMatches(newMatches);
      } else {
        // Use dummy matches that have NO messages
        const dummyNewMatches = DUMMY_MATCHES.filter(match => !match.lastMessage);
        setMatches(dummyNewMatches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      const dummyNewMatches = DUMMY_MATCHES.filter(match => !match.lastMessage);
      setMatches(dummyNewMatches);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();

    const handleStatusChange = ({ userId, status }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('user_status_changed', handleStatusChange);

    return () => {
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [fetchMatches]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches(true);
  };

  const renderItem = ({ item }) => {
    const isOnline = onlineUsers.has(item.user.userId);
    const lastMsg = item.lastMessage;

    return (
      <TouchableOpacity
        style={styles.matchItem}
        onPress={() => navigation.navigate('ProfileDetail', {
          profile: item.user
        })}
      >
        <View style={styles.avatarContainer}>
          {item.user.profilePhoto ? (
            <Image
              source={{ uri: item.user.profilePhoto }}
              style={[
                styles.avatarSmall,
                { borderWidth: 3, borderColor: isOnline ? '#00b000' : '#b7b7b7' }
              ]}
            />
          ) : (
            <View style={[
              styles.avatarPlaceholder,
              { borderWidth: 3, borderColor: isOnline ? '#00b000' : '#b7b7b7' }
            ]}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
          )}
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchName}>
              {item.user.fullName}
            </Text>
            {item.lastInteraction && (
              <Text style={styles.timeText}>
                {new Date(item.lastInteraction).toLocaleDateString()}
              </Text>
            )}
          </View>

          <Text style={styles.roleText} numberOfLines={1}>
            {item.user.role || 'Role not specified'}
          </Text>
          {item.user.location?.address && (
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {item.user.location.address}
            </Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={matches}
        keyExtractor={item => item.matchId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3B30" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches yet.</Text>
            <Text style={styles.emptySubText}>Keep swiping to find your co-founder!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 20,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E2D',
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  roleText: {
    fontSize: 14,
    color: '#6E7BFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6F6F85',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D1D1',
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1E2D',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#6F6F85',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MatchesScreen;
