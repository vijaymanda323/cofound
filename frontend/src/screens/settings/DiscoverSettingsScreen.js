import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/api';

const DiscoverSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    maxDistance: 100,
    minAge: 18,
    maxAge: 65,
    preferredGoals: [],
    preferredSkills: [],
    preferredIndustries: [],
    goalOverride: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const goalOptions = [
    'I have a startup',
    'I have startup ideas, looking for co-founder',
    'I want to join someone\'s startup',
  ];

  const skillOptions = [
    'Software Engineer', 'Product Manager', 'Designer', 'Marketing',
    'Sales', 'Operations', 'Finance', 'Legal', 'Data Scientist',
    'HR / Recruiting', 'Founder / CEO', 'Investor'
  ];

  const industryOptions = [
    'FinTech', 'EdTech', 'HealthTech', 'AgriTech', 'FoodTech',
    'E-commerce', 'SaaS / Enterprise Software', 'AI / Data / ML',
    'ClimateTech', 'Clean Energy', 'Mobility', 'PropTech',
    'Logistics & Supply Chain', 'HRTech', 'AdTech / MarTech',
    'Media / Entertainment', 'Gaming'
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      console.log('Loading discover settings from /settings/discover');
      const response = await API.get('/settings/discover');
      console.log('Settings loaded successfully:', response.data);

      if (response.data.discoverSettings) {
        setSettings(response.data.discoverSettings);
      }
    } catch (error) {
      console.error('Error loading discover settings:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      Alert.alert(
        'Error',
        `Failed to load settings: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await API.put('/settings/discover', settings);
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
              goalOverride: null,
            });
          },
        },
      ]
    );
  };

  const toggleOption = (list, item, field) => {
    const updated = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    setSettings(prev => ({ ...prev, [field]: updated }));
  };

  const renderSectionHeader = (title) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderSliderControl = (label, value, min, max, field, unit = '') => (
    <View style={styles.controlRow}>
      <View style={styles.controlLabelRow}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.controlValue}>{value}{unit}</Text>
      </View>
      <View style={styles.sliderSimulation}>
        <TouchableOpacity
          style={styles.adjustBtn}
          onPress={() => setSettings(prev => ({ ...prev, [field]: Math.max(min, value - 5) }))}
        >
          <Ionicons name="remove" size={20} color="#666" />
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${((value - min) / (max - min)) * 100}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.adjustBtn}
          onPress={() => setSettings(prev => ({ ...prev, [field]: Math.min(max, value + 5) }))}
        >
          <Ionicons name="add" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChips = (options, selected, field) => (
    <View style={styles.chipContainer}>
      {options.map((option, index) => {
        const isActive = selected.includes(option);
        return (
          <TouchableOpacity
            key={index}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => toggleOption(selected, option, field)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>FOUND.</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Discover Settings</Text>
          <Text style={styles.pageSub}>Adjust your search filters to find the perfect partner.</Text>

          {renderSectionHeader('Distance & Age')}
          <View style={styles.card}>
            {renderSliderControl('Maximum Distance', settings.maxDistance, 1, 1000, 'maxDistance', ' km')}
            <View style={styles.divider} />
            {renderSliderControl('Minimum Age', settings.minAge, 18, 65, 'minAge')}
            <View style={styles.divider} />
            {renderSliderControl('Maximum Age', settings.maxAge, 18, 100, 'maxAge')}
          </View>

          {renderSectionHeader('Preferred Goals')}
          {renderChips(goalOptions, settings.preferredGoals, 'preferredGoals')}

          {renderSectionHeader('Preferred Industries')}
          {renderChips(industryOptions, settings.preferredIndustries, 'preferredIndustries')}

          {renderSectionHeader('Preferred Skills')}
          {renderChips(skillOptions, settings.preferredSkills, 'preferredSkills')}

          {renderSectionHeader('Goal Override')}
          <View style={styles.card}>
            <View style={styles.overrideRow}>
              <View style={styles.overrideTextContainer}>
                <Text style={styles.overrideTitle}>See All Profiles</Text>
                <Text style={styles.overrideSub}>Include profiles with goals different from yours</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, settings.goalOverride && styles.toggleBtnActive]}
                onPress={() => setSettings(prev => ({
                  ...prev,
                  goalOverride: prev.goalOverride ? null : 'I want to join someone\'s startup'
                }))}
              >
                <View style={[styles.toggleKnob, settings.goalOverride && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Settings</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset to Default</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FDFDFD',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 25,
  },
  controlRow: {
    marginVertical: 10,
  },
  controlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  controlValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1155ccff',
  },
  sliderSimulation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#1155ccff',
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F2',
    marginVertical: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 25,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  chipActive: {
    backgroundColor: '#1155ccff',
    borderColor: '#1155ccff',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
  },
  actions: {
    marginTop: 20,
    gap: 15,
  },
  saveBtn: {
    backgroundColor: '#1155ccff',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1155cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  resetBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F2F2F2',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  overrideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overrideTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  overrideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  overrideSub: {
    fontSize: 12,
    color: '#666',
  },
  toggleBtn: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
  },
  toggleBtnActive: {
    backgroundColor: '#1155ccff',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
});

export default DiscoverSettingsScreen;
