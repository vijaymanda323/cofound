import { io } from 'socket.io-client';

// Replace with your local IP or backend URL
const SOCKET_URL = 'http://192.168.29.175:8080';

export const socket = io(SOCKET_URL, {
    autoConnect: false,
});

export const connectSocket = (userId) => {
    if (!socket.connected) {
        socket.connect();
        socket.emit('user_online', userId);
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
