import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import API from '../../services/api';

const VerificationScreen = ({ navigation }) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await API.get('/settings/verification');
      if (response.data.verificationStatus) {
        setVerificationStatus(response.data.verificationStatus);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVerificationStatus();
    setRefreshing(false);
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled) {
        await uploadVerificationDocument(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadVerificationDocument = async (asset) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', {
        uri: asset.uri,
        type: asset.mimeType,
        name: asset.name,
      });
      formData.append('documentType', 'verification');

      const response = await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.document) {
        Alert.alert('Success', 'Verification document uploaded successfully');
        loadVerificationStatus();
      }
    } catch (error) {
      console.error('Error uploading verification document:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload document';
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'verified':
        return { color: '#2ECC71', icon: 'checkmark-circle', label: 'Verified', bg: '#E8F5E9' };
      case 'pending':
        return { color: '#F39C12', icon: 'time', label: 'Pending Review', bg: '#FFF3E0' };
      case 'rejected':
        return { color: '#E74C3C', icon: 'close-circle', label: 'Rejected', bg: '#FDEDEC' };
      default:
        return { color: '#999', icon: 'document-text', label: 'Not Verified', bg: '#F9F9F9' };
    }
  };

  const renderStatusCard = () => {
    const status = verificationStatus?.overallStatus || 'not_verified';
    const info = getStatusInfo(status);

    return (
      <View style={[styles.statusCard, { backgroundColor: info.bg, borderColor: info.color }]}>
        <View style={styles.statusHeaderRow}>
          <Ionicons name={info.icon} size={28} color={info.color} />
          <Text style={[styles.statusLabel, { color: info.color }]}>{info.label}</Text>
        </View>
        <Text style={styles.statusDesc}>
          {status === 'verified' && 'Your profile is verified. You have earned the verified partner badge.'}
          {status === 'pending' && 'We are reviewing your documents. This usually takes 24-48 hours.'}
          {status === 'rejected' && 'One or more of your documents were rejected. Please check the notes below.'}
          {status === 'not_verified' && 'Verify your identity to build trust and get better matching priority.'}
        </Text>
      </View>
    );
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
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Profile Verification</Text>
          <Text style={styles.pageSub}>Increase your credibility by verifying your professional identity.</Text>

          {renderStatusCard()}

          <Text style={styles.sectionTitle}>Uploaded Documents</Text>
          {verificationStatus?.verificationDocuments?.length > 0 ? (
            verificationStatus.verificationDocuments.map((doc, idx) => {
              const docInfo = getStatusInfo(doc.verificationStatus);
              return (
                <View key={idx} style={styles.docItem}>
                  <View style={styles.docIconBox}>
                    <Ionicons name="document" size={20} color="#666" />
                  </View>
                  <View style={styles.docContent}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.fileName}</Text>
                    <Text style={styles.docDate}>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.docBadge, { backgroundColor: docInfo.bg }]}>
                    <Text style={[styles.docBadgeText, { color: docInfo.color }]}>
                      {doc.verificationStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="cloud-upload-outline" size={40} color="#DDD" />
              <Text style={styles.emptyText}>No documents uploaded yet.</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Why get verified?</Text>
          <View style={styles.benefitCard}>
            <View style={styles.benefitRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1155ccff" />
              <Text style={styles.benefitText}>Build trust with high-quality co-founders</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="trending-up-outline" size={20} color="#1155ccff" />
              <Text style={styles.benefitText}>Higher visibility in the discovery pool</Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="star-outline" size={20} color="#1155ccff" />
              <Text style={styles.benefitText}>Unlock exclusive verified-only features</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadBtn, uploading && { opacity: 0.7 }]}
            onPress={handleUploadDocument}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="add" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>Upload New Document</Text>
              </>
            )}
          </TouchableOpacity>
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
    marginBottom: 25,
  },
  statusCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 30,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusDesc: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
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
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docContent: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  docDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  docBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  docBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F9F9F9',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginBottom: 25,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 10,
  },
  benefitCard: {
    backgroundColor: '#FDFDFD',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 30,
    gap: 15,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  uploadBtn: {
    backgroundColor: '#1155ccff',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#1155cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default VerificationScreen;
