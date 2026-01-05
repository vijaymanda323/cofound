import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { updateRegistrationStep } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onboardingData = [
    {
      id: 1,
      title: 'Find Your Co-founder',
      subtitle: 'Connect with like-minded entrepreneurs who share your vision and complement your skills',
      icon: '👥',
    },
    {
      id: 2,
      title: 'Build Your Startup',
      subtitle: 'Turn your ideas into reality with the perfect partner by your side',
      icon: '🚀',
    },
    {
      id: 3,
      title: 'Grow Together',
      subtitle: 'Scale your business with shared goals and mutual support',
      icon: '📈',
    },
    {
      id: 4,
      title: 'Success Partnership',
      subtitle: 'Achieve your entrepreneurial dreams with the right co-founder',
      icon: '🤝',
    },
  ];

  const goalOptions = [
    'I have a startup',
    'I have startup ideas, looking for co-founder',
    'I want to join someone\'s startup',
  ];

  const [selectedGoal, setSelectedGoal] = useState(null);

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    // Check if we're on the last slide (goal selection)
    if (currentIndex >= onboardingData.length - 1) {
      // Validate that a goal is selected
      if (!selectedGoal) {
        Alert.alert('Required', 'Please select a goal to continue');
        return;
      }
      
      // Proceed with goal selection
      handleGoalSelect(selectedGoal);
      return;
    }
    
    // Regular onboarding navigation
    flatListRef.current?.scrollToIndex({
      index: currentIndex + 1,
      animated: true,
    });
  };

  const handleSkip = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: onboardingData.length - 1,
        animated: true,
      });
    }
  };

  const handleGoalSelect = async (goal) => {
    setSelectedGoal(goal);
    
    // Update registration step to 1 (onboarding completed)
    await updateRegistrationStep(1);
    
    // Navigate to profile creation
    navigation.replace('ProfileCreation', { selectedGoal: goal });
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    } else {
      navigation.goBack();
    }
  };

  const renderOnboardingItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
        
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderGoalSelection = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🎯</Text>
      </View>
      
      <Text style={styles.title}>What's Your Goal?</Text>
      <Text style={styles.subtitle}>Tell us what you're looking for to find the perfect match</Text>
      
      <View style={styles.goalContainer}>
        {goalOptions.map((goal, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.goalOption,
              selectedGoal === goal && styles.selectedGoal,
            ]}
            onPress={() => handleGoalSelect(goal)}
          >
            <Text style={[
              styles.goalText,
              selectedGoal === goal && styles.selectedGoalText,
            ]}>
              {goal}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderIndicator = (index) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.4, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.indicator,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={[...onboardingData, { id: 'goals', isGoalSelection: true }]}
        renderItem={({ item, index }) => 
          item.isGoalSelection ? renderGoalSelection() : renderOnboardingItem({ item })
        }
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      />

      {currentIndex < onboardingData.length && (
        <View style={styles.indicatorContainer}>
          {onboardingData.map((_, index) => renderIndicator(index))}
        </View>
      )}
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#7A7A7A',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFE9E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1155ccff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  goalContainer: {
    width: '100%',
    marginBottom: 32,
  },
  goalOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  selectedGoal: {
    backgroundColor: '#1155ccff',
    borderColor: '#1155ccff',
  },
  goalText: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedGoalText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7A7A7A',
    fontWeight: '500',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4D4D4',
    marginHorizontal: 4,
  },
});

export default OnboardingScreen;
