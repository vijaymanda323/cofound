import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/api';

const ProfileEditScreen = ({ navigation, route }) => {
    const { initialProfile } = route.params;
    const [profile, setProfile] = useState({
        fullName: initialProfile?.fullName || '',
        location: initialProfile?.location?.address || (typeof initialProfile?.location === 'string' ? initialProfile.location : ''),
        role: initialProfile?.role || 'Co-Founder',
        mission: initialProfile?.mission || '',
        bio: initialProfile?.bio || '',
        experience: initialProfile?.experience?.toString() || '0',
        industries: initialProfile?.industries || [],
    });
    const [isLoading, setIsLoading] = useState(false);

    const roleOptions = ['Co-Founder', 'Team Member', 'Investor', 'Mentor'];

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            if (!profile.fullName.trim()) {
                Alert.alert('Error', 'Full Name is required');
                return;
            }

            setIsLoading(true);
            const profileData = {
                fullName: profile.fullName,
                location: {
                    type: 'Point',
                    coordinates: initialProfile?.location?.coordinates || [0, 0],
                    address: profile.location
                },
                role: profile.role,
                mission: profile.mission,
                bio: profile.bio,
                experience: parseInt(profile.experience) || 0,
                industries: profile.industries,
            };

            await API.post('/profile', profileData);
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
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
                <TouchableOpacity
                    style={[styles.saveHeaderBtn, isLoading && { opacity: 0.5 }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#1155ccff" />
                    ) : (
                        <Text style={styles.saveHeaderBtnText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.fullName}
                            onChangeText={(v) => handleInputChange('fullName', v)}
                            placeholder="Your full name"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.location}
                            onChangeText={(v) => handleInputChange('location', v)}
                            placeholder="Your location"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Your Role</Text>
                        <View style={styles.optionsContainer}>
                            {roleOptions.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.optionBtn,
                                        profile.role === role && styles.optionBtnActive
                                    ]}
                                    onPress={() => handleInputChange('role', role)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        profile.role === role && styles.optionTextActive
                                    ]}>
                                        {role}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Quick Pitch (Bio)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={profile.bio}
                            onChangeText={(v) => handleInputChange('bio', v)}
                            placeholder="Short catchy pitch..."
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>The Vision (Mission)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={profile.mission}
                            onChangeText={(v) => handleInputChange('mission', v)}
                            placeholder="What are you building?"
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Total Experience (Years)</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.experience}
                            onChangeText={(v) => handleInputChange('experience', v)}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save All Changes</Text>
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
    saveHeaderBtn: {
        paddingHorizontal: 15,
    },
    saveHeaderBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1155ccff',
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    optionBtnActive: {
        backgroundColor: '#1155ccff',
        borderColor: '#1155ccff',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    optionTextActive: {
        color: '#FFF',
    },
    saveBtn: {
        backgroundColor: '#1155ccff',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#1155cc',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default ProfileEditScreen;
