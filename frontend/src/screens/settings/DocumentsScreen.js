import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

const DocumentsScreen = ({ navigation }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/documents');
      
      if (response.data.documents) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled) {
        await uploadDocument(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadDocument = async (asset) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('document', {
        uri: asset.uri,
        type: asset.mimeType,
        name: asset.name,
      });
      formData.append('documentType', 'other');

      const response = await axios.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.document) {
        Alert.alert('Success', 'Document uploaded successfully');
        loadDocuments();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload document';
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (document) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/documents/${document.id}`);
              Alert.alert('Success', 'Document deleted successfully');
              loadDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleDocumentPress = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDocumentIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'pptx':
      case 'ppt':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#00b000';
      case 'rejected':
        return '#ff4444';
      default:
        return '#ffaa00';
    }
  };

  const renderDocumentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => handleDocumentPress(item)}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>{getDocumentIcon(item.fileType)}</Text>
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.fileName}
        </Text>
        
        <View style={styles.documentMeta}>
          <Text style={styles.documentSize}>{formatFileSize(item.fileSize)}</Text>
          <Text style={styles.documentDate}>{formatDate(item.uploadedAt)}</Text>
        </View>

        {item.documentType === 'verification' && (
          <View style={styles.verificationStatus}>
            <Text style={[
              styles.verificationStatusText,
              { color: getVerificationStatusColor(item.verificationStatus) }
            ]}>
              {item.verificationStatus === 'approved' && '✓ Verified'}
              {item.verificationStatus === 'rejected' && '✗ Rejected'}
              {item.verificationStatus === 'pending' && '⏳ Pending'}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteDocument(item)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📁</Text>
      <Text style={styles.emptyTitle}>No Documents Yet</Text>
      <Text style={styles.emptySubtitle}>
        Upload your documents for verification and profile enhancement
      </Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handlePickDocument}
        disabled={uploading}
      >
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : 'Upload First Document'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDocumentModal = () => {
    if (!selectedDocument) return null;

    return (
      <Modal
        visible={showDocumentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.documentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDocumentModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalDocumentIcon}>
                <Text style={styles.modalDocumentIconText}>
                  {getDocumentIcon(selectedDocument.fileType)}
                </Text>
              </View>

              <Text style={styles.modalDocumentName}>
                {selectedDocument.fileName}
              </Text>

              <View style={styles.modalDetails}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Type:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedDocument.fileType.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Size:</Text>
                  <Text style={styles.modalDetailValue}>
                    {formatFileSize(selectedDocument.fileSize)}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Uploaded:</Text>
                  <Text style={styles.modalDetailValue}>
                    {formatDate(selectedDocument.uploadedAt)}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Category:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedDocument.documentType.charAt(0).toUpperCase() + 
                     selectedDocument.documentType.slice(1)}
                  </Text>
                </View>

                {selectedDocument.documentType === 'verification' && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Status:</Text>
                    <Text style={[
                      styles.modalDetailValue,
                      { color: getVerificationStatusColor(selectedDocument.verificationStatus) }
                    ]}>
                      {selectedDocument.verificationStatus.charAt(0).toUpperCase() + 
                       selectedDocument.verificationStatus.slice(1)}
                    </Text>
                  </View>
                )}

                {selectedDocument.verificationNotes && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Notes:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedDocument.verificationNotes}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => setShowDocumentModal(false)}
              >
                <Text style={styles.modalActionButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Documents</Text>
        <TouchableOpacity
          style={styles.uploadHeaderButton}
          onPress={handlePickDocument}
          disabled={uploading}
        >
          <Text style={styles.uploadHeaderButtonText}>
            {uploading ? '⏳' : '+ Upload'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={documents.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1155ccff']}
            tintColor="#1155ccff"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {renderDocumentModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EFE9E1',
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  uploadHeaderButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  uploadHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  documentItem: {
    backgroundColor: '#EFE9E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentIconText: {
    fontSize: 20,
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
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#7A7A7A',
  },
  documentDate: {
    fontSize: 12,
    color: '#7A7A7A',
  },
  verificationStatus: {
    alignSelf: 'flex-start',
  },
  verificationStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  uploadButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalDocumentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDocumentIconText: {
    fontSize: 32,
  },
  modalDocumentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDetails: {
    width: '100%',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#7A7A7A',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalActionButton: {
    backgroundColor: '#1155ccff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DocumentsScreen;
