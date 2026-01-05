import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';

const HelpScreen = ({ navigation }) => {
  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@found.com');
  };

  const handleCall = () => {
    Linking.openURL('tel:+919876543210');
  };

  const renderHelpSection = (title, items) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.helpItem}
          onPress={item.onPress}
        >
          <View style={styles.helpItemLeft}>
            <Text style={styles.helpIcon}>{item.icon}</Text>
            <View style={styles.helpItemContent}>
              <Text style={styles.helpItemTitle}>{item.title}</Text>
              {item.subtitle && <Text style={styles.helpItemSubtitle}>{item.subtitle}</Text>}
            </View>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const contactOptions = [
    {
      icon: '💬',
      title: 'WhatsApp Support',
      subtitle: 'Chat with our support team',
      onPress: handleWhatsApp,
    },
    {
      icon: '📧',
      title: 'Email Support',
      subtitle: 'support@found.com',
      onPress: handleEmail,
    },
    {
      icon: '📞',
      title: 'Phone Support',
      subtitle: '+91 98765 43210',
      onPress: handleCall,
    },
  ];

  const faqItems = [
    {
      icon: '❓',
      title: 'How does matching work?',
      subtitle: 'Learn about our matching algorithm',
      onPress: () => Alert.alert('Matching', 'When both users tap Yes on each other\'s profiles, a match is created and you can start chatting.'),
    },
    {
      icon: '🔒',
      title: 'Is my data secure?',
      subtitle: 'Privacy and security information',
      onPress: () => Alert.alert('Security', 'We use industry-standard encryption and security practices to protect your data.'),
    },
    {
      icon: '✅',
      title: 'How to get verified?',
      subtitle: 'Verification process explained',
      onPress: () => Alert.alert('Verification', 'Upload government ID or business documents to get your profile verified.'),
    },
    {
      icon: '🚫',
      title: 'How to block someone?',
      subtitle: 'Blocking and reporting users',
      onPress: () => Alert.alert('Blocking', 'Go to chat options and select "Block User" to prevent further contact.'),
    },
  ];

  const resources = [
    {
      icon: '📖',
      title: 'User Guide',
      subtitle: 'Complete guide to using Found',
      onPress: () => Alert.alert('User Guide', 'Comprehensive user guide coming soon!'),
    },
    {
      icon: '🎥',
      title: 'Video Tutorials',
      subtitle: 'Watch and learn',
      onPress: () => Alert.alert('Tutorials', 'Video tutorials coming soon!'),
    },
    {
      icon: '📰',
      title: 'Blog & Tips',
      subtitle: 'Startup advice and insights',
      onPress: () => Alert.alert('Blog', 'Blog and tips coming soon!'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Contact Support */}
      {renderHelpSection('Contact Support', contactOptions)}

      {/* Frequently Asked Questions */}
      {renderHelpSection('Frequently Asked Questions', faqItems)}

      {/* Resources */}
      {renderHelpSection('Resources', resources)}

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Found</Text>
        <View style={styles.aboutContent}>
          <Text style={styles.aboutText}>
            Found is the premier platform for connecting entrepreneurs with their ideal co-founders. 
            Our mission is to help build successful startups by matching compatible founders based on 
            skills, goals, and vision.
          </Text>
          
          <View style={styles.aboutStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10,000+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5,000+</Text>
              <Text style={styles.statLabel}>Matches Made</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1,000+</Text>
              <Text style={styles.statLabel}>Startups Founded</Text>
            </View>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>Found</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appTagline}>Find the right co-founder</Text>
        <Text style={styles.appCopyright}>© 2024 Found. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 2,
  },
  helpItemSubtitle: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  arrow: {
    fontSize: 20,
    color: '#7A7A7A',
  },
  aboutContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
    marginBottom: 20,
  },
  aboutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1155ccff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7A7A7A',
    textAlign: 'center',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#7A7A7A',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  appCopyright: {
    fontSize: 12,
    color: '#7A7A7A',
  },
});

export default HelpScreen;
