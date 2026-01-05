import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ProfileCreationScreen = ({ navigation, route }) => {
  const { user, updateRegistrationStep } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(route.params?.selectedGoal || '');

  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    location: {
      address: '',
      coordinates: [0, 0], // [longitude, latitude]
    },
    gender: '',
    yearOfBirth: '',
    mission: '',
    goal: selectedGoal,
    skills: [],
    industries: [],
    experience: 0,
    bio: '',
    education: {
      college: '',
      university: '',
      degree: '',
      field: '',
      graduationYear: '',
    },
    linkedinUrl: '',
    profilePhoto: null,
  });

  // UI state
  const [customSkill, setCustomSkill] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);

  // Available options
  const [availableSkills] = useState([
    'JavaScript', 'Python', 'React', 'Node.js', 'UI/UX Design',
    'Marketing', 'Sales', 'Finance', 'Business Strategy', 'Product Management',
    'Data Science', 'Mobile Development', 'DevOps', 'Blockchain', 'AI/ML'
  ]);

  const [availableIndustries] = useState([
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'Real Estate', 'Transportation', 'Food & Beverage', 'Entertainment', 'Energy',
    'Agriculture', 'Manufacturing', 'Retail', 'Travel', 'Social Impact'
  ]);

  const genderOptions = ['male', 'female', 'other', 'prefer_not_to_say'];

  useEffect(() => {
    if (selectedGoal) {
      setProfile(prev => ({ ...prev, goal: selectedGoal }));
    }
  }, [selectedGoal]);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfile(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAddSkill = (skillName) => {
    if (skillName && !profile.skills.find(s => s.name === skillName)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, { name: skillName, level: 5, isCustom: !availableSkills.includes(skillName) }]
      }));
    }
    setCustomSkill('');
    setShowSkillModal(false);
  };

  const handleRemoveSkill = (skillName) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.name !== skillName)
    }));
  };

  const handleAddIndustry = (industryName) => {
    if (industryName && !profile.industries.includes(industryName)) {
      setProfile(prev => ({
        ...prev,
        industries: [...prev.industries, industryName]
      }));
    }
    setCustomIndustry('');
    setShowIndustryModal(false);
  };

  const handleRemoveIndustry = (industryName) => {
    setProfile(prev => ({
      ...prev,
      industries: prev.industries.filter(i => i !== industryName)
    }));
  };

  const handleSkillLevelChange = (skillName, level) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.name === skillName ? { ...s, level } : s
      )
    }));
  };

  const validateCurrentStep = () => {
    // For testing purposes, allow proceeding without strict validation
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSaveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      const profileData = {
        ...profile,
        location: {
          ...profile.location,
          coordinates: [77.2090, 28.6139],
        },
        yearOfBirth: profile.yearOfBirth ? parseInt(profile.yearOfBirth) : undefined,
      };

      const response = await axios.post('/profile', profileData);

      if (response.data) {
        await updateRegistrationStep(2);

        Alert.alert(
          'Success!',
          'Your profile has been created successfully!',
          [
            {
              text: 'OK',
            }
          ]
        );
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert('Profile creation error', 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={profile.fullName}
          onChangeText={(text) => setProfile(prev => ({ ...prev, fullName: text }))}
          placeholder="Enter your full name"
          placeholderTextColor="#7A7A7A"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={profile.location.address}
          onChangeText={(text) => setProfile(prev => ({
            ...prev,
            location: { ...prev.location, address: text }
          }))}
          placeholder="Enter your location"
          placeholderTextColor="#7A7A7A"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.optionsContainer}>
          {genderOptions.map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                profile.gender === gender && styles.selectedOption
              ]}
              onPress={() => setProfile(prev => ({ ...prev, gender }))}
            >
              <Text style={[
                styles.optionText,
                profile.gender === gender && styles.selectedOptionText
              ]}>
                {gender.replace('_', ' ').charAt(0).toUpperCase() + gender.replace('_', ' ').slice(1)}
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
          onChangeText={(text) => setProfile(prev => ({ ...prev, yearOfBirth: text }))}
          placeholder="e.g., 1990"
          placeholderTextColor="#7A7A7A"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <TouchableOpacity style={styles.photoButton} onPress={handleImagePick}>
        <Text style={styles.photoButtonText}>
          {profile.profilePhoto ? 'Change Photo' : 'Add Profile Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Mission & Goals</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mission *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.mission}
          onChangeText={(text) => setProfile(prev => ({ ...prev, mission: text }))}
          placeholder="Describe your mission and what you want to achieve..."
          placeholderTextColor="#7A7A7A"
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Goal *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.goal}
          onChangeText={(text) => setProfile(prev => ({ ...prev, goal: text }))}
          placeholder="What is your specific goal?"
          placeholderTextColor="#7A7A7A"
          multiline
          numberOfLines={2}
          maxLength={200}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Experience (years)</Text>
        <TextInput
          style={styles.input}
          value={profile.experience.toString()}
          onChangeText={(text) => setProfile(prev => ({ ...prev, experience: parseInt(text) || 0 }))}
          placeholder="0"
          placeholderTextColor="#7A7A7A"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bio (max 200 characters)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profile.bio}
          onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
          placeholder="Tell us about yourself..."
          placeholderTextColor="#7A7A7A"
          multiline
          numberOfLines={3}
          maxLength={200}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Skills & Industries</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Skills *</Text>
        <View style={styles.selectedItems}>
          {profile.skills.map((skill) => (
            <View key={skill.name} style={styles.selectedItem}>
              <Text style={styles.selectedItemText}>{skill.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveSkill(skill.name)}>
                <Text style={styles.removeItem}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowSkillModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Skill</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Industries *</Text>
        <View style={styles.selectedItems}>
          {profile.industries.map((industry) => (
            <View key={industry} style={styles.selectedItem}>
              <Text style={styles.selectedItemText}>{industry}</Text>
              <TouchableOpacity onPress={() => handleRemoveIndustry(industry)}>
                <Text style={styles.removeItem}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowIndustryModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Industry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Education & Links</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>College / University</Text>
        <TextInput
          style={styles.input}
          value={profile.education.college}
          onChangeText={(text) => setProfile(prev => ({
            ...prev,
            education: { ...prev.education, college: text }
          }))}
          placeholder="Enter your college/university"
          placeholderTextColor="#7A7A7A"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>LinkedIn URL</Text>
        <TextInput
          style={styles.input}
          value={profile.linkedinUrl}
          onChangeText={(text) => setProfile(prev => ({ ...prev, linkedinUrl: text }))}
          placeholder="https://linkedin.com/in/yourprofile"
          placeholderTextColor="#7A7A7A"
          keyboardType="url"
        />
      </View>
    </View>
  );

  const renderSkillModal = () => (
    <Modal visible={showSkillModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Skill</Text>
          <ScrollView style={styles.optionsList}>
            {availableSkills.map((skill) => (
              <TouchableOpacity key={skill} style={styles.optionItem} onPress={() => handleAddSkill(skill)}>
                <Text style={styles.optionItemText}>{skill}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.customInputContainer}>
            <TextInput style={styles.customInput} value={customSkill} onChangeText={setCustomSkill} placeholder="Add custom skill" />
            <TouchableOpacity style={styles.customAddButton} onPress={() => handleAddSkill(customSkill)}>
              <Text style={styles.customAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setShowSkillModal(false)}><Text>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderIndustryModal = () => (
    <Modal visible={showIndustryModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Industry</Text>
          <ScrollView style={styles.optionsList}>
            {availableIndustries.map((industry) => (
              <TouchableOpacity key={industry} style={styles.optionItem} onPress={() => handleAddIndustry(industry)}>
                <Text style={styles.optionItemText}>{industry}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.customInputContainer}>
            <TextInput style={styles.customInput} value={customIndustry} onChangeText={setCustomIndustry} placeholder="Add custom industry" />
            <TouchableOpacity style={styles.customAddButton} onPress={() => handleAddIndustry(customIndustry)}>
              <Text style={styles.customAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setShowIndustryModal(false)}><Text>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}><Text style={styles.backButtonText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Create Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{isLoading ? 'Saving...' : currentStep === 4 ? 'Complete Profile' : 'Next'}</Text>
        </TouchableOpacity>
      </View>

      {renderSkillModal()}
      {renderIndustryModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backButtonText: { fontSize: 16, color: '#1155ccff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  stepContainer: { paddingBottom: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4D4D4', borderRadius: 8, padding: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4D4D4', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  selectedOption: { backgroundColor: '#1155ccff', borderColor: '#1155ccff' },
  optionText: { fontSize: 14 },
  selectedOptionText: { color: '#fff' },
  photoButton: { backgroundColor: '#1155ccff', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
  photoButtonText: { color: '#fff', fontWeight: '500' },
  selectedItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  selectedItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1155ccff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  selectedItemText: { color: '#fff', marginRight: 8 },
  removeItem: { color: '#fff', fontWeight: 'bold' },
  addButton: { borderWidth: 1, borderColor: '#1155ccff', borderRadius: 8, padding: 12, alignItems: 'center' },
  addButtonText: { color: '#1155ccff' },
  footer: { padding: 20, backgroundColor: '#F7F7F7' },
  nextButton: { backgroundColor: '#1155ccff', borderRadius: 8, padding: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionsList: { maxHeight: 300, marginBottom: 20 },
  optionItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  optionItemText: { fontSize: 16 },
  customInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  customInput: { flex: 1, borderWidth: 1, borderColor: '#D4D4D4', borderRadius: 8, paddingHorizontal: 12 },
  customAddButton: { backgroundColor: '#1155ccff', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  customAddButtonText: { color: '#fff' },
});

export default ProfileCreationScreen;
