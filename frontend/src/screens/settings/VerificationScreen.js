import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

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
      const response = await axios.get('/settings/verification');
      
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
        type: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ],
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

      const response = await axios.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#00b000';
      case 'pending':
        return '#ffaa00';
      case 'rejected':
        return '#ff4444';
      default:
        return '#7A7A7A';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      default:
        return '📄';
    }
  };

  const renderVerificationStatus = () => {
    if (!verificationStatus) return null;

    const { isVerified, verificationDocuments, overallStatus } = verificationStatus;

    return (
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusCard,
          { borderColor: getStatusColor(overallStatus) }
        ]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(overallStatus)}
            </Text>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(overallStatus) }
            ]}>
              {overallStatus === 'verified' && 'Verified'}
              {overallStatus === 'not_verified' && 'Not Verified'}
              {overallStatus === 'pending' && 'Pending Review'}
            </Text>
          </View>

          <Text style={styles.statusDescription}>
            {overallStatus === 'verified' && 
              'Your profile has been verified. You now have a verified badge on your profile.'
            }
            {overallStatus === 'not_verified' && 
              'Upload verification documents to get your profile verified and build trust with potential co-founders.'
            }
            {overallStatus === 'pending' && 
              'Your verification documents are under review. This typically takes 1-2 business days.'
            }
          </Text>
        </View>
      </View>
    );
  };

  const renderVerificationDocuments = () => {
    if (!verificationStatus?.verificationDocuments?.length) {
      return (
        <View style={styles.noDocumentsContainer}>
          <Text style={styles.noDocumentsIcon}>📁</Text>
          <Text style={styles.noDocumentsTitle}>No Verification Documents</Text>
          <Text style={styles.noDocumentsSubtitle}>
            Upload government ID, business registration, or other verification documents
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.documentsContainer}>
        <Text style={styles.documentsTitle}>Verification Documents</Text>
        
        {verificationStatus.verificationDocuments.map((doc, index) => (
          <View key={doc.id} style={styles.documentItem}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName}>{doc.fileName}</Text>
              <Text style={styles.documentType}>
                {doc.fileType.toUpperCase()} • 
                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
              </Text>
              
              <View style={styles.documentStatus}>
                <Text style={[
                  styles.documentStatusText,
                  { color: getStatusColor(doc.verificationStatus) }
                ]}>
                  {doc.verificationStatus === 'approved' && '✓ Approved'}
                  {doc.verificationStatus === 'rejected' && '✗ Rejected'}
                  {doc.verificationStatus === 'pending' && '⏳ Pending Review'}
                </Text>
              </View>

              {doc.verificationNotes && (
                <Text style={styles.verificationNotes}>
                  Notes: {doc.verificationNotes}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderVerificationInfo = () => (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>Why Get Verified?</Text>
      
      <View style={styles.infoPoints}>
        <View style={styles.infoPoint}>
          <Text style={styles.infoPointIcon}>🛡️</Text>
          <Text style={styles.infoPointText}>
            Build trust with potential co-founders
          </Text>
        </View>
        
        <View style={styles.infoPoint}>
          <Text style={styles.infoPointIcon}>⭐</Text>
          <Text style={styles.infoPointText}>
            Get priority matching and visibility
          </Text>
        </View>
        
        <View style={styles.infoPoint}>
          <Text style={styles.infoPointIcon}>🔒</Text>
          <Text style={styles.infoPointText}>
            Show you're serious about finding partners
          </Text>
        </View>
      </View>

      <View style={styles.acceptedDocuments}>
        <Text style={styles.acceptedTitle}>Accepted Documents:</Text>
        <Text style={styles.acceptedList}>
          • Government ID (Aadhaar, Passport, Driver's License){'\n'}
          • Business Registration Certificate{'\n'}
          • Professional Certifications{'\n'}
          • Educational Degrees{'\n'}
          • Company Letterhead
        </Text>
      </View>
    </View>
  );

  if (isLoading && !verificationStatus) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading verification status...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {renderVerificationStatus()}
      
      {renderVerificationDocuments()}
      
      {renderVerificationInfo()}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.disabledButton]}
          onPress={handleUploadDocument}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Verification Document'}
          </Text>
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
  statusContainer: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#EFE9E1',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
  },
  documentsContainer: {
    padding: 20,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 16,
  },
  documentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 8,
  },
  documentStatus: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  documentStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  verificationNotes: {
    fontSize: 12,
    color: '#7A7A7A',
    fontStyle: 'italic',
  },
  noDocumentsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDocumentsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDocumentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDocumentsSubtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 16,
  },
  infoPoints: {
    marginBottom: 24,
  },
  infoPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoPointIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoPointText: {
    fontSize: 16,
    color: '#4A4A4A',
    flex: 1,
  },
  acceptedDocuments: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  acceptedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  acceptedList: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  actionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  uploadButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerificationScreen;
