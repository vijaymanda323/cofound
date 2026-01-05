import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import GoalCard from '../../components/onboarding/GoalCard';
import ProgressBar from '../../components/onboarding/ProgressBar';

const GoalSelectionScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { goal, setGoal, clearError } = useOnboarding();

  const goals = [
    {
      id: 'startup',
      title: 'I have a startup',
      icon: '🚀',
    },
    {
      id: 'ideas',
      title: 'I have startup ideas, looking for a co-founder',
      icon: '💡',
    },
    {
      id: 'join',
      title: "I want to join someone's startup",
      icon: '🤝',
    },
  ];

  const handleGoalSelect = (selectedGoal) => {
    setGoal(selectedGoal.title);
    clearError();
  };

  const handleNext = () => {
    if (!goal) {
      return;
    }
    navigation.navigate('RoleSelection');
  };

  const handleSkip = () => {
    navigation.navigate('RoleSelection');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.appBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
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
        <ProgressBar currentStep={1} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.primaryText }]}>
          Select your Goal
        </Text>

        {/* Goal Cards */}
        <View style={styles.cardsContainer}>
          {goals.map((goalItem) => (
            <GoalCard
              key={goalItem.id}
              goal={goalItem.title}
              icon={goalItem.icon}
              isSelected={goal === goalItem.title}
              onPress={() => handleGoalSelect(goalItem)}
              testID={`goal-card-${goalItem.id}`}
            />
          ))}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.footer, { backgroundColor: colors.appBackground }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: goal ? colors.primary : colors.border,
              opacity: goal ? 1 : 0.6,
            }
          ]}
          onPress={handleNext}
          disabled={!goal}
          testID="next-button"
        >
          <Text style={styles.nextButtonText}>Next</Text>
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
  placeholder: {
    width: 50,
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
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalSelectionScreen;
