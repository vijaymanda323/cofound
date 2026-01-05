import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  StyleSheet,
  Alert 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const MultiSelectDropdown = ({ 
  label, 
  options, 
  selectedItems, 
  onSelectionChange, 
  placeholder,
  allowCustom = true,
  testID 
}) => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const toggleSelection = (item) => {
    const isSelected = selectedItems.includes(item);
    if (isSelected) {
      onSelectionChange(selectedItems.filter(i => i !== item));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  const addCustomItem = () => {
    if (customValue.trim() && !selectedItems.includes(customValue.trim())) {
      onSelectionChange([...selectedItems, customValue.trim()]);
      setCustomValue('');
    }
  };

  const removeItem = (item) => {
    onSelectionChange(selectedItems.filter(i => i !== item));
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.label, { color: colors.primaryText }]}>{label}</Text>
      
      <TouchableOpacity
        style={[
          styles.dropdown,
          { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }
        ]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[
          styles.dropdownText,
          { 
            color: selectedItems.length > 0 ? colors.primaryText : colors.secondaryText 
          }
        ]}>
          {selectedItems.length > 0 
            ? `${selectedItems.length} selected` 
            : placeholder
          }
        </Text>
        <Text style={[styles.arrow, { color: colors.secondaryText }]}>▼</Text>
      </TouchableOpacity>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.selectedItem,
                { backgroundColor: colors.primary }
              ]}
            >
              <Text style={styles.selectedText}>{item}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item)}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: colors.cardBackground }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.primaryText }]}>
                Select {label}
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.secondaryText }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    { 
                      backgroundColor: selectedItems.includes(option) 
                        ? colors.primary + '20' 
                        : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => toggleSelection(option)}
                >
                  <Text style={[
                    styles.optionText,
                    { 
                      color: selectedItems.includes(option) 
                        ? colors.primary 
                        : colors.primaryText 
                    }
                  ]}>
                    {option}
                  </Text>
                  {selectedItems.includes(option) && (
                    <Text style={[styles.check, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {allowCustom && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={[
                    styles.customInput,
                    { 
                      backgroundColor: colors.appBackground,
                      borderColor: colors.border,
                      color: colors.primaryText,
                    }
                  ]}
                  value={customValue}
                  onChangeText={setCustomValue}
                  placeholder={`Add custom ${label.toLowerCase()}`}
                  placeholderTextColor={colors.secondaryText}
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary }
                  ]}
                  onPress={addCustomItem}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.doneButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  arrow: {
    fontSize: 12,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 8,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  optionsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  check: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultiSelectDropdown;
