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
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const FeedbackScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState({
    content: '',
    type: 'general',
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { key: 'general', label: 'General Feedback', icon: '💭' },
    { key: 'bug', label: 'Bug Report', icon: '🐛' },
    { key: 'feature', label: 'Feature Request', icon: '💡' },
    { key: 'complaint', label: 'Complaint', icon: '😞' },
    { key: 'compliment', label: 'Compliment', icon: '😊' },
  ];

  const handleSubmit = async () => {
    if (!feedback.content.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    if (feedback.content.length > 200) {
      Alert.alert('Error', 'Feedback must be less than 200 characters');
      return;
    }

    try {
      setIsSubmitting(true);

      await axios.post('/settings/feedback', feedback);

      Alert.alert(
        'Thank You!',
        'Your feedback has been sent successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      // Reset form
      setFeedback({
        content: '',
        type: 'general',
        rating: 0,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectFeedbackType = (type) => {
    setFeedback(prev => ({ ...prev, type }));
  };

  const selectRating = (rating) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  const renderFeedbackTypes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Feedback Type</Text>
      <View style={styles.typesContainer}>
        {feedbackTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeButton,
              feedback.type === type.key && styles.selectedType,
            ]}
            onPress={() => selectFeedbackType(type.key)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={[
              styles.typeLabel,
              feedback.type === type.key && styles.selectedTypeLabel,
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRating = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rate Your Experience (Optional)</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>How would you rate your experience?</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={styles.starButton}
              onPress={() => selectRating(star)}
            >
              <Text style={[
                styles.star,
                feedback.rating >= star && styles.selectedStar,
              ]}>
                {feedback.rating >= star ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {feedback.rating > 0 && (
          <Text style={styles.ratingText}>
            {feedback.rating === 1 && 'Poor'}
            {feedback.rating === 2 && 'Fair'}
            {feedback.rating === 3 && 'Good'}
            {feedback.rating === 4 && 'Very Good'}
            {feedback.rating === 5 && 'Excellent'}
          </Text>
        )}
      </View>
    </View>
  );

  const renderFeedbackForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Feedback</Text>
      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>
          Tell us what you think (max 200 characters)
        </Text>
        <TextInput
          style={styles.textInput}
          value={feedback.content}
          onChangeText={(text) => setFeedback(prev => ({ ...prev, content: text }))}
          placeholder="Share your thoughts, suggestions, or report issues..."
          placeholderTextColor="#7A7A7A"
          multiline
          numberOfLines={5}
          maxLength={200}
          textAlignVertical="top"
        />
        <View style={styles.characterCount}>
          <Text style={[
            styles.characterCountText,
            feedback.content.length > 180 && styles.warningText,
          ]}>
            {feedback.content.length}/200
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Information</Text>
      <View style={styles.contactInfo}>
        <Text style={styles.contactLabel}>Email:</Text>
        <Text style={styles.contactValue}>{user?.email || 'N/A'}</Text>
        <Text style={styles.contactNote}>
          Your feedback will be sent to: aarati@tensorn.com
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {renderFeedbackTypes()}
        {renderRating()}
        {renderFeedbackForm()}
        {renderContactInfo()}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 16,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  selectedType: {
    backgroundColor: '#1155ccff',
    borderColor: '#1155ccff',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  selectedTypeLabel: {
    color: '#FFFFFF',
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 32,
  },
  selectedStar: {
    color: '#FFD700',
  },
  ratingText: {
    fontSize: 14,
    color: '#7A7A7A',
    fontStyle: 'italic',
  },
  formContainer: {
    flex: 1,
  },
  formLabel: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#4A4A4A',
    backgroundColor: '#F7F7F7',
    minHeight: 120,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#7A7A7A',
  },
  warningText: {
    color: '#ff4444',
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#1155ccff',
    fontWeight: '500',
    marginBottom: 8,
  },
  contactNote: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7A7A7A',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FeedbackScreen;
