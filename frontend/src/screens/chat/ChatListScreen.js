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

const ChatListScreen = ({ navigation }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    const fetchChats = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const res = await API.get('/match');
            // Filter to show only matches WITH messages
            const chatsWithMessages = (res.data.matches || []).filter(match => match.lastMessage);

            if (chatsWithMessages.length > 0) {
                setChats(chatsWithMessages);
            } else {
                // Use dummy matches that have messages
                const dummyChats = DUMMY_MATCHES.filter(match => match.lastMessage);
                setChats(dummyChats);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
            const dummyChats = DUMMY_MATCHES.filter(match => match.lastMessage);
            setChats(dummyChats);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchChats();

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
    }, [fetchChats]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats(true);
    };

    const renderItem = ({ item }) => {
        const isOnline = onlineUsers.has(item.user.userId);
        const lastMsg = item.lastMessage;

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('Chat', {
                    matchId: item.matchId,
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

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName}>
                            {item.user.fullName}
                        </Text>
                        {item.lastInteraction && (
                            <Text style={styles.timeText}>
                                {new Date(item.lastInteraction).toLocaleDateString()}
                            </Text>
                        )}
                    </View>

                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMsg ? lastMsg.content : 'No messages yet. Say hi! 👋'}
                    </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1155ccff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <FlatList
                data={chats}
                keyExtractor={item => item.matchId}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1155ccff" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No chats yet.</Text>
                        <Text style={styles.emptySubText}>Start a conversation with your matches!</Text>
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
    chatItem: {
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
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1E2D',
    },
    timeText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    lastMessage: {
        fontSize: 14,
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

export default ChatListScreen;
