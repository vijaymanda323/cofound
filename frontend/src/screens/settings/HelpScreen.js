import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/api';

const HelpScreen = ({ navigation }) => {
  const [supportInfo, setSupportInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupportInfo();
  }, []);

  const fetchSupportInfo = async () => {
    try {
      setLoading(true);
      const res = await API.get('/settings/support');
      setSupportInfo(res.data.supportInfo);
    } catch (error) {
      console.error('Error fetching support info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (supportInfo?.whatsappQR) Linking.openURL(supportInfo.whatsappQR);
  };

  const handleEmail = () => {
    if (supportInfo?.supportEmail) Linking.openURL(`mailto:${supportInfo.supportEmail}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>FOUND.</Text>
        <TouchableOpacity style={styles.feedbackBtn} onPress={() => navigation.navigate('Feedback')}>
          <Ionicons name="chatbubble-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1155ccff" />
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.pageTitle}>Help & Support</Text>
            <Text style={styles.pageSub}>We're here to help you build your dream startup team.</Text>

            <Text style={styles.sectionTitle}>Contact Us</Text>
            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
                <View style={[styles.contactIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="logo-whatsapp" size={30} color="#2ECC71" />
                </View>
                <Text style={styles.contactLabel}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
                <View style={[styles.contactIconBox, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="mail" size={30} color="#1155ccff" />
                </View>
                <Text style={styles.contactLabel}>Email Us</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.card}>
              {supportInfo?.faqs.map((faq, index) => (
                <View key={index}>
                  <TouchableOpacity
                    style={styles.faqItem}
                    onPress={() => Alert.alert(faq.question, faq.answer)}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                  </TouchableOpacity>
                  {index < supportInfo.faqs.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Help Articles</Text>
            {supportInfo?.helpArticles.map((article, idx) => (
              <TouchableOpacity
                key={article.id || idx}
                style={styles.articleCard}
                onPress={() => Alert.alert(article.title, article.content)}
              >
                <View style={styles.articleIconBox}>
                  <Ionicons name="book-outline" size={20} color="#666" />
                </View>
                <View style={styles.articleContent}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleSub} numberOfLines={1}>{article.content}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>
            ))}

            <View style={styles.footer}>
              <Text style={styles.footerLogo}>FOUND.</Text>
              <Text style={styles.footerTag}>v1.0.0 • Professional Edition</Text>
            </View>
          </View>
        )}
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
  feedbackBtn: {
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
    marginBottom: 25,
  },
  loadingBox: {
    paddingTop: 100,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#999',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 15,
    marginTop: 15,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  card: {
    backgroundColor: '#FDFDFD',
    borderRadius: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 30,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F2',
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  articleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  articleSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DDD',
    letterSpacing: 2,
  },
  footerTag: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 5,
    fontWeight: '600',
  },
});

export default HelpScreen;
