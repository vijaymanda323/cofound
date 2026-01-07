import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { socket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { DUMMY_MATCHES } from '../../data/dummyData';

const ChatScreen = ({ route, navigation }) => {
  const { profile, matchId } = route.params;
  const { user } = useAuth();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    socket.emit('join_chat', matchId);

    const handleMessage = (data) => {
      setMessages(prev => [...prev, {
        id: data._id,
        content: data.content,
        senderId: data.senderId,
        timestamp: data.timestamp,
        status: data.status,
      }]);
      markAsRead([data._id]);
    };

    const handleStatus = (data) => {
      setMessages(prev => prev.map(m =>
        m.id === data.messageId ? { ...m, status: data.status } : m
      ));
    };

    const handleTyping = (data) => {
      if (data.userId !== user._id) {
        setTyping(data.typing);
      }
    };

    socket.on('receive_message', handleMessage);
    socket.on('message_status', handleStatus);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('message_status', handleStatus);
      socket.off('user_typing', handleTyping);
    };
  }, [matchId]);

  const fetchMessages = async () => {
    // If it's a dummy match, don't call the backend
    if (typeof matchId === 'string' && matchId.startsWith('match')) {
      const dummyMatch = DUMMY_MATCHES.find(m => m.matchId === matchId);
      setMessages(dummyMatch?.messages || []);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await API.get(`/chat/${matchId}`);
      setMessages(res.data.messages || []);

      // Mark unread messages as read
      const unreadIds = res.data.messages
        .filter(m => !m.isOwn && m.status !== 'read')
        .map(m => m.id);
      if (unreadIds.length > 0) markAsRead(unreadIds);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageIds) => {
    if (typeof matchId === 'string' && matchId.startsWith('match')) {
      return;
    }

    try {
      await API.put(`/chat/${matchId}/read`, { messageIds });
      socket.emit('message_read', { matchId, userId: user._id });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    if (msg.trim() === '') return;

    const content = msg.trim();
    setMsg('');

    // If it's a dummy match, just add to local state
    if (typeof matchId === 'string' && matchId.startsWith('match')) {
      setMessages(prev => [...prev, {
        id: `m-${Date.now()}`,
        content,
        senderId: 'current_user',
        timestamp: new Date(),
        status: 'sent',
        isOwn: true
      }]);
      return;
    }

    try {
      const res = await API.post(`/chat/${matchId}`, { content });
      setMessages(prev => [...prev, {
        id: res.data.data.id,
        content: res.data.data.content,
        senderId: user._id,
        timestamp: res.data.data.timestamp,
        status: 'sent',
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer be able to message each other.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.post(`/match/${matchId}/block`, { reason: 'Blocked from chat' });
              Alert.alert('Success', 'User blocked successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to block user');
            }
          }
        }
      ]
    );
  };

  const handleUnmatch = () => {
    Alert.alert(
      'Remove Connection',
      'Are you sure you want to remove this connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.delete(`/match/${matchId}`);
              Alert.alert('Success', 'Connection removed');
              navigation.navigate('Matches');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove connection');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'date_separator') {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      );
    }

    const isMe = item.senderId === user?._id || item.isOwn;
    return (
      <View style={[
        styles.messageBubble,
        isMe ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMe ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timeText, isMe && { color: '#E0E0E0' }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && (
            <Ionicons
              name={item.status === 'read' ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={item.status === 'read' ? '#4CAF50' : '#E0E0E0'}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1155ccff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButtonCircle}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerLogo}>FOUND.</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.headerInfoRow}>
          <View style={styles.avatarContainer}>
            {profile.profilePhoto ? (
              <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#666" />
              </View>
            )}
            <View style={styles.onlineBadge}>
              <Ionicons name="checkmark" size={8} color="#FFF" />
            </View>
          </View>

          <TouchableOpacity
            style={styles.infoBox}
            onPress={() => navigation.navigate('ProfileDetail', { profile })}
          >
            <Text style={styles.infoBoxText} numberOfLines={1}>
              {profile.fullName}, {profile.location?.address?.split(',')[0]} {profile.distance}km
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, idx) => item.id || `sep-${idx}`}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={msg}
            onChangeText={(text) => {
              setMsg(text);
              if (text.length > 0) socket.emit('typing_start', { matchId, userId: user._id });
              else socket.emit('typing_stop', { matchId, userId: user._id });
            }}
            placeholder="Type a message..."
            placeholderTextColor="#6F6F85"
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleBlock(); }}>
              <Text style={styles.menuItemTextDestructive}>Block User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleUnmatch(); }}>
              <Text style={styles.menuItemTextDestructive}>Remove Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1155ccff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  infoBoxText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  messageList: {
    padding: 15,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1155ccff',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F1F6',
  },
  messageText: {
    fontSize: 15,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1E1E2D',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F1F6',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#1155ccff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  menuItem: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F6',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  menuItemTextDestructive: {
    fontSize: 16,
    color: '#1155ccff',
    fontWeight: '600',
  },
});

export default ChatScreen;
