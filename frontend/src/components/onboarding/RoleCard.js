import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const RoleCard = ({ 
  role, 
  equityRange, 
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
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.equityBadge}>
          <Text style={[
            styles.equityText,
            { color: isSelected ? '#FFFFFF' : colors.primaryText }
          ]}>
            {equityRange}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.title,
        { color: isSelected ? '#FFFFFF' : colors.primaryText }
      ]}>
        {role}
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
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  equityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  equityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RoleCard;
