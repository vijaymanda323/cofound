import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import API from '../../services/api';

const ProfileCreationScreen = ({ navigation, route }) => {
  const { user, updateRegistrationStep } = useAuth();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Get selected goal from onboarding
  const selectedGoal = route.params?.selectedGoal || '';

  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    location: '',
    gender: '',
    yearOfBirth: '',
    mission: '',
    goal: selectedGoal,
    skills: [],
    industries: [],
    experience: '',
    bio: '',
    education: '',
    linkedinUrl: '',
  });

  // Handle input changes
  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSaveProfile();
    }
  };

  // Handle back step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      // Map frontend state to backend model format
      const profileData = {
        fullName: profile.fullName,
        location: {
          type: 'Point',
          coordinates: [0, 0], // Default coordinates
          address: profile.location
        },
        gender: profile.gender.toLowerCase(),
        yearOfBirth: parseInt(profile.yearOfBirth),
        mission: profile.mission,
        goal: profile.goal === 'I have startup ideas, looking for a co-founder'
          ? 'I have startup ideas, looking for co-founder'
          : profile.goal,
        skills: profile.skills.map(skill => ({
          name: skill,
          level: 5,
          isCustom: true
        })),
        industries: profile.industries,
        experience: profile.experience ? parseInt(profile.experience) : 0,
        bio: profile.bio,
        education: {
          college: profile.education
        },
        linkedinUrl: profile.linkedinUrl
      };

      console.log('Saving profile to backend:', profileData);

      const response = await API.post('/profile', profileData);
      console.log('Profile saved successfully:', response.data);

      // Update registration step to completed (step 2)
      await updateRegistrationStep(2);

      Alert.alert('Success', 'Profile created successfully!', [
        {
          text: 'OK', onPress: () => {
            // Navigation will be handled by App.js based on registrationStep
          }
        }
      ]);

    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save profile. Please check all fields.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Render step 1 - Basic Info
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={profile.fullName}
          onChangeText={(value) => handleInputChange('fullName', value)}
          placeholder="Enter your full name"
          placeholderTextColor={colors.secondaryText}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={profile.location}
          onChangeText={(value) => handleInputChange('location', value)}
          placeholder="Enter your location"
          placeholderTextColor={colors.secondaryText}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.optionsContainer}>
          {['Male', 'Female', 'Other'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                profile.gender === option && styles.selectedOption
              ]}
              onPress={() => handleInputChange('gender', option)}
            >
              <Text style={[
                styles.optionText,
                profile.gender === option && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Year of Birth</Text>
        <TextInput
          style={styles.input}
          value={profile.yearOfBirth}
          onChangeText={(value) => handleInputChange('yearOfBirth', value)}
          placeholder="e.g., 1990"
          placeholderTextColor={colors.secondaryText}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>
    </View>
  );

  // Render step 2 - Mission & Goals
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Mission & Goals</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mission *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.mission}
          onChangeText={(value) => handleInputChange('mission', value)}
          placeholder="Describe your mission and what you want to achieve..."
          placeholderTextColor={colors.secondaryText}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Goal</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.goal}
          onChangeText={(value) => handleInputChange('goal', value)}
          placeholder="What is your specific goal?"
          placeholderTextColor={colors.secondaryText}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Experience (years)</Text>
        <TextInput
          style={styles.input}
          value={profile.experience}
          onChangeText={(value) => handleInputChange('experience', value)}
          placeholder="0"
          placeholderTextColor={colors.secondaryText}
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  // Render step 3 - Skills & Industries
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Skills & Industries</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Skills</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.skills.join(', ')}
          onChangeText={(value) => handleInputChange('skills', value.split(',').map(s => s.trim()))}
          placeholder="Enter your skills (comma separated)"
          placeholderTextColor={colors.secondaryText}
          multiline
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Industries</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.industries.join(', ')}
          onChangeText={(value) => handleInputChange('industries', value.split(',').map(s => s.trim()))}
          placeholder="Enter industries you're interested in (comma separated)"
          placeholderTextColor={colors.secondaryText}
          multiline
        />
      </View>
    </View>
  );

  // Render step 4 - Additional Info
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Additional Information</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.bio}
          onChangeText={(value) => handleInputChange('bio', value)}
          placeholder="Tell us about yourself..."
          placeholderTextColor={colors.secondaryText}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Education</Text>
        <TextInput
          style={styles.input}
          value={profile.education}
          onChangeText={(value) => handleInputChange('education', value)}
          placeholder="Enter your education"
          placeholderTextColor={colors.secondaryText}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>LinkedIn URL</Text>
        <TextInput
          style={styles.input}
          value={profile.linkedinUrl}
          onChangeText={(value) => handleInputChange('linkedinUrl', value)}
          placeholder="https://linkedin.com/in/yourprofile"
          placeholderTextColor={colors.secondaryText}
          keyboardType="url"
        />
      </View>
    </View>
  );

  // Render progress bar
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              currentStep >= step && styles.progressDotActive,
            ]}
          />
          {step < 4 && (
            <View
              style={[
                styles.progressLine,
                currentStep > step && styles.progressLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Profile</Text>
        <View style={styles.placeholder} />
      </View>

      {renderProgressBar()}

      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.disabledButton]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {isLoading ? 'Saving...' : currentStep === 4 ? 'Complete Profile' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1155ccff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  placeholder: {
    width: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4D4D4',
  },
  progressDotActive: {
    backgroundColor: '#1155ccff',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D4D4D4',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#1155ccff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#4A4A4A',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedOption: {
    backgroundColor: '#1155ccff',
    borderColor: '#1155ccff',
  },
  optionText: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F7F7F7',
  },
  nextButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileCreationScreen;
