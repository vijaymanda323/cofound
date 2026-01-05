import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { useAuth } from '../../context/AuthContext';
import RoleCard from '../../components/onboarding/RoleCard';
import MultiSelectDropdown from '../../components/onboarding/MultiSelectDropdown';
import ProgressBar from '../../components/onboarding/ProgressBar';

const RoleSelectionScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { 
    goal, 
    role, 
    equityRange, 
    skills, 
    industries, 
    experience, 
    bio, 
    education, 
    linkedinProfile,
    setRole,
    setSkills,
    setIndustries,
    setExperience,
    setBio,
    setEducation,
    setLinkedInProfile,
    validateStep2,
    clearError,
    isLoading,
    error
  } = useOnboarding();
  
  const { updateRegistrationStep } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      id: 'cofounder',
      title: 'Co-Founder',
      equityRange: '10% to 50% equity',
      icon: '🤝',
    },
    {
      id: 'team_member',
      title: 'Team Member',
      equityRange: 'up to 5% equity',
      icon: '👥',
    },
    {
      id: 'investor',
      title: 'Investor',
      equityRange: 'up to 20% equity',
      icon: '💰',
    },
    {
      id: 'mentor',
      title: 'Mentor',
      equityRange: 'up to 5% equity',
      icon: '🎓',
    },
  ];

  const skillsOptions = [
    'React Native', 'JavaScript', 'TypeScript', 'Node.js', 'Python',
    'Java', 'UI/UX Design', 'Product Management', 'Marketing', 'Sales',
    'Business Development', 'Finance', 'Data Science', 'Mobile Development',
    'Web Development', 'DevOps', 'Cloud Computing', 'AI/ML', 'Blockchain',
  ];

  const industriesOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'Media', 'Energy', 'Real Estate', 'Transportation', 'Food & Beverage',
    'Manufacturing', 'Retail', 'Entertainment', 'Sports', 'Travel',
    'Agriculture', 'Logistics', 'Insurance', 'Legal', 'Consulting',
  ];

  const handleRoleSelect = (selectedRole, selectedEquityRange) => {
    setRole(selectedRole, selectedEquityRange);
    clearError();
  };

  const handleComplete = async () => {
    // Validate required fields
    if (!role) {
      Alert.alert('Required', 'Please select a role');
      return;
    }
    if (skills.length === 0) {
      Alert.alert('Required', 'Please select at least one skill');
      return;
    }
    if (industries.length === 0) {
      Alert.alert('Required', 'Please select at least one industry');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update registration step to show onboarding is complete
      await updateRegistrationStep(2);
      
      // Navigate to main app or next step
      Alert.alert(
        'Success!',
        'Onboarding completed successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to main app or profile completion
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.appBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <ProgressBar currentStep={2} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.primaryText }]}>
          Your ideal role
        </Text>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {roles.map((roleItem) => (
            <RoleCard
              key={roleItem.id}
              role={roleItem.title}
              equityRange={roleItem.equityRange}
              icon={roleItem.icon}
              isSelected={role === roleItem.title}
              onPress={() => handleRoleSelect(roleItem.title, roleItem.equityRange)}
              testID={`role-card-${roleItem.id}`}
            />
          ))}
        </View>

        {/* Additional Fields */}
        {role && (
          <View style={styles.fieldsContainer}>
            <MultiSelectDropdown
              label="Skills*"
              options={skillsOptions}
              selectedItems={skills}
              onSelectionChange={setSkills}
              placeholder="Select your skills"
              testID="skills-dropdown"
            />

            <MultiSelectDropdown
              label="Industries*"
              options={industriesOptions}
              selectedItems={industries}
              onSelectionChange={setIndustries}
              placeholder="Select industries you're interested in"
              testID="industries-dropdown"
            />

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.primaryText }]}>
                Experience (years)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.primaryText,
                  }
                ]}
                value={experience}
                onChangeText={setExperience}
                placeholder="Enter your experience in years"
                placeholderTextColor={colors.secondaryText}
                keyboardType="numeric"
                testID="experience-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.primaryText }]}>
                Bio
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.primaryText,
                  }
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself (max 200 characters)"
                placeholderTextColor={colors.secondaryText}
                multiline
                numberOfLines={3}
                maxLength={200}
                testID="bio-input"
              />
              <Text style={[styles.charCount, { color: colors.secondaryText }]}>
                {bio.length}/200
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.primaryText }]}>
                Education
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.primaryText,
                  }
                ]}
                value={education}
                onChangeText={setEducation}
                placeholder="Your education (max 50 characters)"
                placeholderTextColor={colors.secondaryText}
                maxLength={50}
                testID="education-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.primaryText }]}>
                LinkedIn Profile
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.primaryText,
                  }
                ]}
                value={linkedinProfile}
                onChangeText={setLinkedInProfile}
                placeholder="https://linkedin.com/in/yourprofile"
                placeholderTextColor={colors.secondaryText}
                keyboardType="url"
                testID="linkedin-input"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.footer, { backgroundColor: colors.appBackground }]}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            {
              backgroundColor: role && skills.length > 0 && industries.length > 0 
                ? colors.primary 
                : colors.border,
              opacity: role && skills.length > 0 && industries.length > 0 ? 1 : 0.6,
            }
          ]}
          onPress={handleComplete}
          disabled={!role || skills.length === 0 || industries.length === 0 || isSubmitting}
          testID="complete-button"
        >
          <Text style={styles.completeButtonText}>
            {isSubmitting ? 'Completing...' : 'Complete'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 100, // Space for fixed button
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 32,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  fieldsContainer: {
    gap: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;
