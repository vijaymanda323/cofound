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
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import API from '../../services/api';

const DocumentsScreen = ({ navigation }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await API.get('/documents');
      if (response.data.documents) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      // Alert.alert('Error', 'Failed to load documents');
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
          'application/docx',
          'application/pptx',
          'image/jpeg',
          'image/png',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No file selected', 'Please select a file first.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType,
        name: selectedFile.name,
      });
      formData.append('documentType', 'other');

      await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Document uploaded successfully');
      setSelectedFile(null);
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await API.delete(`/documents/${id}`);
            loadDocuments();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>FOUND.</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>My Documents</Text>
        </View>

        {/* Documents List Card */}
        <View style={styles.listCard}>
          {isLoading && !refreshing ? (
            <ActivityIndicator color="#1155cc" style={{ padding: 20 }} />
          ) : documents.length > 0 ? (
            documents.map((doc, index) => (
              <View key={doc.id} style={styles.docItem}>
                <View style={styles.docLeft}>
                  <Text style={styles.docIndex}>{index + 1}. </Text>
                  <Text style={styles.docName} numberOfLines={1}>{doc.fileName}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(doc.id)}>
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No documents uploaded yet.</Text>
          )}
        </View>

        {/* Select File Button */}
        <View style={styles.spacing} />

        {selectedFile && (
          <View style={styles.selectedFileBox}>
            <Text style={styles.selectedLabel}>Selected:</Text>
            <Text style={styles.selectedName}>{selectedFile.name}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.selectBtn}
          onPress={handlePickDocument}
        >
          <Text style={styles.selectBtnText}>Select a file</Text>
        </TouchableOpacity>
        <Text style={styles.formatHint}>.pdf, .docx, .ppt, .jpg, .png</Text>

        <View style={{ flex: 1 }} />

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadBtn, !selectedFile && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.uploadBtnText}>Upload</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    minHeight: '100%',
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1.5,
    borderColor: '#333',
    minHeight: 150,
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  docIndex: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  docName: {
    fontSize: 16,
    color: '#444',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  spacing: {
    height: 100,
  },
  selectBtn: {
    backgroundColor: '#1155ccff',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    width: '100%',
  },
  selectBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  formatHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  selectedFileBox: {
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  selectedName: {
    fontSize: 14,
    color: '#333',
  },
  uploadBtn: {
    backgroundColor: '#9DA7B5', // Gray color from mockup
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  uploadBtnDisabled: {
    opacity: 0.5,
  },
  uploadBtnText: {
    color: '#1a2a5a', // Dark blue text on gray button
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default DocumentsScreen;
