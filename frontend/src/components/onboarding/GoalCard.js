import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const GoalCard = ({ 
  goal, 
  icon, 
  isSelected, 
  onPress, 
  testID 
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? colors.primary : colors.cardBackground,
          borderColor: isSelected ? colors.primary : colors.border,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[
        styles.title,
        { color: isSelected ? '#FFFFFF' : colors.primaryText }
      ]}>
        {goal}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginVertical: 8,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default GoalCard;
