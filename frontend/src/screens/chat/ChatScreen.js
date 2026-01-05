import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';

const ChatScreen = ({ navigation, route }) => {
  const { matchId, userName, userProfile } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Get current user info
    const getCurrentUser = async () => {
      try {
        const response = await axios.get('/auth/me');
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    
    getCurrentUser();
    loadMessages();
    setupSocketConnection();

    return () => {
      // Cleanup socket connection
      if (socketRef.current) {
        socketRef.current.emit('typing_stop', { matchId, userId: currentUser?.id });
        socketRef.current.disconnect();
      }
    };
  }, [matchId]);

  useEffect(() => {
    // Update header title when userName changes
    navigation.setOptions({
      headerTitle: userName || 'Chat',
    });
  }, [userName, navigation]);

  const setupSocketConnection = () => {
    const socket = io('http://localhost:5000', {
      auth: {
        token: axios.defaults.headers.common.Authorization?.replace('Bearer ', '')
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat socket');
      socket.emit('join_chat', matchId);
    });

    socket.on('receive_message', (messageData) => {
      setMessages(prev => {
        const newMessages = [...prev];
        
        // Remove date separator if it exists for today
        const today = new Date().toDateString();
        const existingTodayIndex = newMessages.findIndex(msg => 
          msg.type === 'date_separator' && msg.date === 'Today'
        );
        
        if (existingTodayIndex !== -1) {
          newMessages.splice(existingTodayIndex, 1);
        }
        
        // Add new message
        newMessages.push({
          id: messageData._id,
          content: messageData.content,
          senderId: messageData.senderId,
          type: messageData.type || 'text',
          timestamp: messageData.timestamp,
          isOwn: messageData.senderId === currentUser?.id,
        });
        
        // Add date separator if needed
        const messageDate = new Date(messageData.timestamp);
        const dateLabel = getDateLabel(messageDate);
        
        if (newMessages.length === 1 || 
            newMessages[newMessages.length - 2]?.date !== dateLabel) {
          newMessages.splice(newMessages.length - 1, 0, {
            type: 'date_separator',
            date: dateLabel,
            timestamp: messageDate,
          });
        }
        
        return newMessages;
      });

      // Mark message as read if it's not from current user
      if (messageData.senderId !== currentUser?.id) {
        markMessageAsRead(messageData._id);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    socket.on('message_status', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, status: data.status, readBy: data.readBy }
          : msg
      ));
    });

    socket.on('user_typing', (data) => {
      if (data.userId !== currentUser?.id) {
        setOtherUserTyping(data.typing);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat socket');
    });
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/chat/${matchId}`);
      
      if (response.data.messages) {
        setMessages(response.data.messages);
        
        // Mark all messages as read
        setTimeout(() => {
          markAllMessagesAsRead();
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(`/chat/${matchId}/read`, { messageIds: [messageId] });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllMessagesAsRead = async () => {
    try {
      await axios.put(`/chat/${matchId}/read`);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    const messageContent = inputText.trim();
    setInputText('');

    try {
      const response = await axios.post(`/chat/${matchId}`, {
        content: messageContent,
        type: 'text',
      });

      // Message will be received through socket, so no need to add it manually
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageContent); // Restore message on error
    }
  };

  const handleTypingStart = () => {
    if (!isTyping && currentUser) {
      setIsTyping(true);
      socketRef.current?.emit('typing_start', { matchId, userId: currentUser.id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  const handleTypingStop = () => {
    if (isTyping && currentUser) {
      setIsTyping(false);
      socketRef.current?.emit('typing_stop', { matchId, userId: currentUser.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleRemoveConnection = () => {
    Alert.alert(
      'Remove Connection',
      'Are you sure you want to remove this connection? This will delete all chat history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/match/${matchId}`);
              navigation.goBack();
            } catch (error) {
              console.error('Error removing connection:', error);
              Alert.alert('Error', 'Failed to remove connection');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You won\'t be able to match or chat with them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(`/match/${matchId}/block`);
              navigation.goBack();
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const getDateLabel = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'date_separator') {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{item.date}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        item.isOwn ? styles.ownMessage : styles.otherMessage,
      ]}>
        <View style={[
          styles.messageBubble,
          item.isOwn ? styles.ownBubble : styles.otherBubble,
        ]}>
          <Text style={[
            styles.messageText,
            item.isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {item.content}
          </Text>
        </View>
        
        <View style={[
          styles.messageInfo,
          item.isOwn ? styles.ownMessageInfo : styles.otherMessageInfo,
        ]}>
          <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
          
          {item.isOwn && (
            <Text style={styles.messageStatus}>
              {item.status === 'read' ? '✔✔' : item.status === 'delivered' ? '✔✔' : '✔'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{userName}</Text>
          {userProfile?.location && (
            <Text style={styles.headerLocation}>
              📍 {userProfile.location.address}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.optionsButton} 
          onPress={() => setShowOptions(true)}
        >
          <Text style={styles.optionsButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id || item.date}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            ListFooterComponent={renderTypingIndicator}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onContentSizeChange={handleTypingStart}
              onFocus={handleTypingStart}
              onBlur={handleTypingStop}
              placeholder="Type a message..."
              placeholderTextColor="#7A7A7A"
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.disabledSendButton]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModal}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleRemoveConnection}
            >
              <Text style={styles.optionText}>Remove Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleBlockUser}
            >
              <Text style={[styles.optionText, styles.blockOption]}>Block User</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelOption}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EFE9E1',
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  headerLocation: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 2,
  },
  optionsButton: {
    padding: 8,
  },
  optionsButtonText: {
    fontSize: 20,
    color: '#4A4A4A',
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
  messagesContainer: {
    padding: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#7A7A7A',
    backgroundColor: '#EFE9E1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#1155ccff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#4A4A4A',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  ownMessageInfo: {
    justifyContent: 'flex-end',
  },
  otherMessageInfo: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    color: '#7A7A7A',
  },
  messageStatus: {
    fontSize: 11,
    color: '#7A7A7A',
    marginLeft: 4,
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#7A7A7A',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EFE9E1',
    borderTopWidth: 1,
    borderTopColor: '#D4D4D4',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 16,
    color: '#4A4A4A',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  optionText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  blockOption: {
    color: '#ff4444',
  },
  cancelOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#1155ccff',
    fontWeight: '500',
  },
});

export default ChatScreen;
