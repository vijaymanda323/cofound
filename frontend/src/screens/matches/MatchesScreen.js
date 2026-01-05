import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    loadMatches();
    setupSocketConnection();
    
    return () => {
      // Cleanup socket connection
    };
  }, []);

  const setupSocketConnection = () => {
    const socket = io('http://localhost:5000', {
      auth: {
        token: axios.defaults.headers.common.Authorization?.replace('Bearer ', '')
      }
    });

    socket.on('user_status_changed', (data) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => new Set(prev).add(data.userId));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  };

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/match');
      
      if (response.data.matches) {
        setMatches(response.data.matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleMatchPress = (match) => {
    navigation.navigate('Chat', {
      matchId: match.matchId,
      userName: match.user.fullName,
      userProfile: match.user,
    });
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const formatLastMessage = (lastMessage) => {
    if (!lastMessage) return 'No messages yet';
    
    const maxLength = 40;
    const message = lastMessage.content;
    
    if (message.length > maxLength) {
      return message.substring(0, maxLength) + '...';
    }
    
    return message;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const renderMatchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={() => handleMatchPress(item)}
    >
      <View style={styles.matchHeader}>
        <View style={styles.profileContainer}>
          {/* Profile Photo */}
          <View style={[
            styles.profilePhoto,
            isUserOnline(item.user.userId) && styles.onlineProfilePhoto
          ]}>
            {item.user.profilePhoto ? (
              <Text style={styles.photoText}>📷</Text>
            ) : (
              <Text style={styles.avatarText}>
                {item.user.fullName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          
          {/* Online Status Indicator */}
          <View style={[
            styles.onlineIndicator,
            isUserOnline(item.user.userId) ? styles.onlineIndicatorActive : styles.onlineIndicatorInactive
          ]} />
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.user.fullName}</Text>
            {item.user.isVerified && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>
          
          <Text style={styles.location}>
            📍 {item.user.location.address}
            {item.distance && ` • ${item.distance}km`}
          </Text>
          
          <Text style={styles.lastMessage} numberOfLines={1}>
            {formatLastMessage(item.lastMessage)}
          </Text>
        </View>

        <View style={styles.matchMeta}>
          <Text style={styles.timestamp}>
            {item.lastMessage ? formatTime(item.lastMessage.timestamp) : formatTime(item.matchedAt)}
          </Text>
          
          {item.user.isVerified && (
            <View style={styles.verifiedContainer}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Connection Info */}
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionText}>
          Connected {formatTime(item.matchedAt)}
        </Text>
        <Text style={styles.messageCount}>
          {item.messageCount} {item.messageCount === 1 ? 'message' : 'messages'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💫</Text>
      <Text style={styles.emptyTitle}>No Matches Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start swiping to find your perfect co-founder match!
      </Text>
      <TouchableOpacity
        style={styles.discoverButton}
        onPress={() => navigation.navigate('Discovery')}
      >
        <Text style={styles.discoverButtonText}>Start Discovering</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.matchId.toString()}
        contentContainerStyle={matches.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1155ccff']}
            tintColor="#1155ccff"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  matchItem: {
    backgroundColor: '#EFE9E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profilePhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b7b7b7',
  },
  onlineProfilePhoto: {
    borderColor: '#00b000',
  },
  photoText: {
    fontSize: 20,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EFE9E1',
  },
  onlineIndicatorActive: {
    backgroundColor: '#00b000',
  },
  onlineIndicatorInactive: {
    backgroundColor: '#b7b7b7',
  },
  matchInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginRight: 8,
  },
  verifiedBadge: {
    color: '#00b000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#4A4A4A',
    flex: 1,
  },
  matchMeta: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#7A7A7A',
    marginBottom: 4,
  },
  verifiedContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: 10,
    color: '#00b000',
    fontWeight: '500',
  },
  connectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D4D4D4',
  },
  connectionText: {
    fontSize: 12,
    color: '#7A7A7A',
  },
  messageCount: {
    fontSize: 12,
    color: '#7A7A7A',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  discoverButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  discoverButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MatchesScreen;
