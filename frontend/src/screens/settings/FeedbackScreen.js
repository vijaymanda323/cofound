import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/api';

const FeedbackScreen = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    { key: 'general', label: 'General', icon: 'chatbubble-outline' },
    { key: 'bug', label: 'Bug', icon: 'bug-outline' },
    { key: 'feature', label: 'Idea', icon: 'bulb-outline' },
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Missing Info', 'Please share your thoughts with us.');
      return;
    }

    try {
      setLoading(true);
      await API.post('/settings/feedback', {
        content: content.trim(),
        type,
        rating
      });

      Alert.alert(
        'Thank You! 🎉',
        'Your feedback helps us make Found better for everyone.',
        [{ text: 'Great', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Oops!', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>FOUND.</Text>
        <TouchableOpacity
          style={[styles.sendBtn, (!content.trim() || loading) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1155ccff" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.pageTitle}>Send Feedback</Text>
            <Text style={styles.pageSub}>We value your input. Tell us how we can improve Found for you.</Text>

            <Text style={styles.sectionTitle}>What's on your mind?</Text>
            <View style={styles.typeRow}>
              {feedbackTypes.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                  onPress={() => setType(t.key)}
                >
                  <Ionicons
                    name={t.icon}
                    size={20}
                    color={type === t.key ? '#FFF' : '#666'}
                  />
                  <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Rate your experience</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons
                    name={rating >= s ? 'star' : 'star-outline'}
                    size={40}
                    color={rating >= s ? '#FFD60A' : '#E0E0E0'}
                    style={{ marginHorizontal: 5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Your Message</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={setContent}
                placeholder="Tell us everything..."
                placeholderTextColor="#BBB"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.note}>
              Your feedback is anonymous unless you'd like us to reach out about a specific issue.
            </Text>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    paddingHorizontal: 15,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1155ccff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  pageSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#999',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 15,
    marginTop: 15,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  typeBtnActive: {
    backgroundColor: '#1155ccff',
    borderColor: '#1155ccff',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: '#FDFDFD',
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputContainer: {
    backgroundColor: '#FDFDFD',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 20,
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    color: '#333',
    minHeight: 180,
    lineHeight: 24,
  },
  note: {
    fontSize: 12,
    color: '#BBB',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default FeedbackScreen;
