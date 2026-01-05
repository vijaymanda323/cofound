import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import axios from 'axios';

const DiscoverSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    maxDistance: 100,
    minAge: 18,
    maxAge: 65,
    preferredGoals: [],
    preferredSkills: [],
    preferredIndustries: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const goalOptions = [
    'I have a startup',
    'I have startup ideas, looking for co-founder',
    'I want to join someone\'s startup',
  ];

  const skillOptions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'UI/UX Design',
    'Marketing', 'Sales', 'Finance', 'Business Strategy', 'Product Management',
    'Data Science', 'Mobile Development', 'DevOps', 'Blockchain', 'AI/ML'
  ];

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'Real Estate', 'Transportation', 'Food & Beverage', 'Entertainment', 'Energy',
    'Agriculture', 'Manufacturing', 'Retail', 'Travel', 'Social Impact'
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/settings/discover');
      
      if (response.data.discoverSettings) {
        setSettings(response.data.discoverSettings);
      }
    } catch (error) {
      console.error('Error loading discover settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await axios.put('/settings/discover', settings);
      
      Alert.alert('Success', 'Settings saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all discover settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              maxDistance: 100,
              minAge: 18,
              maxAge: 65,
              preferredGoals: [],
              preferredSkills: [],
              preferredIndustries: [],
            });
          },
        },
      ]
    );
  };

  const toggleGoal = (goal) => {
    setSettings(prev => ({
      ...prev,
      preferredGoals: prev.preferredGoals.includes(goal)
        ? prev.preferredGoals.filter(g => g !== goal)
        : [...prev.preferredGoals, goal]
    }));
  };

  const toggleSkill = (skill) => {
    setSettings(prev => ({
      ...prev,
      preferredSkills: prev.preferredSkills.includes(skill)
        ? prev.preferredSkills.filter(s => s !== skill)
        : [...prev.preferredSkills, skill]
    }));
  };

  const toggleIndustry = (industry) => {
    setSettings(prev => ({
      ...prev,
      preferredIndustries: prev.preferredIndustries.includes(industry)
        ? prev.preferredIndustries.filter(i => i !== industry)
        : [...prev.preferredIndustries, industry]
    }));
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSlider = (label, value, min, max, onValueChange) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View 
          style={[
            styles.sliderFill,
            { width: `${((value - min) / (max - min)) * 100}%` }
          ]}
        />
      </View>
      <View style={styles.sliderButtons}>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onValueChange(Math.max(min, value - 1))}
        >
          <Text style={styles.sliderButtonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onValueChange(Math.min(max, value + 1))}
        >
          <Text style={styles.sliderButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderToggleOptions = (options, selected, onToggle) => (
    <View style={styles.optionsContainer}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selected.includes(option) && styles.selectedOption
          ]}
          onPress={() => onToggle(option)}
        >
          <Text style={[
            styles.optionText,
            selected.includes(option) && styles.selectedOptionText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderSection('Location & Age', (
        <>
          {renderSlider(
            'Maximum Distance (km)',
            settings.maxDistance,
            1,
            1000,
            (value) => setSettings(prev => ({ ...prev, maxDistance: value }))
          )}
          
          {renderSlider(
            'Minimum Age',
            settings.minAge,
            18,
            100,
            (value) => setSettings(prev => ({ ...prev, minAge: value }))
          )}
          
          {renderSlider(
            'Maximum Age',
            settings.maxAge,
            18,
            100,
            (value) => setSettings(prev => ({ ...prev, maxAge: value }))
          )}
        </>
      ))}

      {renderSection('Preferred Goals', (
        renderToggleOptions(goalOptions, settings.preferredGoals, toggleGoal)
      ))}

      {renderSection('Preferred Skills', (
        renderToggleOptions(skillOptions, settings.preferredSkills, toggleSkill)
      ))}

      {renderSection('Preferred Industries', (
        renderToggleOptions(industryOptions, settings.preferredIndustries, toggleIndustry)
      ))}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1155ccff',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginBottom: 8,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#1155ccff',
    borderRadius: 2,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFE9E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 16,
    paddingHorizontal: 12,
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
  actionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DiscoverSettingsScreen;
