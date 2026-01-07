import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ProfileDetailScreen = ({ route, navigation }) => {
    const { profile } = route.params;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.scroll}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.hero}>
                    <View style={styles.avatarLarge}>
                        <Text style={{ fontSize: 80 }}>👤</Text>
                    </View>
                    <Text style={styles.name}>{profile.fullName}</Text>
                    <Text style={styles.location}>{profile.location?.address || 'Location not available'}</Text>
                    <Text style={styles.role}>{profile.role}</Text>
                </View>

                <View style={styles.content}>
                    {profile.mission && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mission</Text>
                            <Text style={styles.sectionText}>{profile.mission}</Text>
                        </View>
                    )}

                    {profile.bio && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Bio</Text>
                            <Text style={styles.sectionText}>{profile.bio}</Text>
                        </View>
                    )}

                    {profile.skills && profile.skills.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Skills</Text>
                            {profile.skills.map((skill, index) => (
                                <Text key={index} style={styles.skillItem}>• {skill.name} (Level {skill.level})</Text>
                            ))}
                        </View>
                    )}

                    {profile.industries && profile.industries.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Industries</Text>
                            <Text style={styles.sectionText}>{profile.industries.join(', ')}</Text>
                        </View>
                    )}

                    {profile.education && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Education</Text>
                            <Text style={styles.sectionText}>
                                {profile.education.degree} from {profile.education.college}
                            </Text>
                        </View>
                    )}

                    {profile.experience !== undefined && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Experience</Text>
                            <Text style={styles.sectionText}>{profile.experience} years</Text>
                        </View>
                    )}

                    {profile.equityRange && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Equity Range</Text>
                            <Text style={styles.sectionText}>{profile.equityRange}</Text>
                        </View>
                    )}

                    {profile.distance && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Distance</Text>
                            <Text style={styles.sectionText}>{profile.distance} km away</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.connectBtnText}>Back to Discovery</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scroll: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hero: {
        alignItems: 'center',
        paddingBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F1F6',
    },
    avatarLarge: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#F0F1F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    name: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E1E2D',
    },
    location: {
        fontSize: 16,
        color: '#6F6F85',
        marginTop: 5,
    },
    role: {
        fontSize: 14,
        color: '#1155ccff',
        marginTop: 5,
        fontWeight: '600',
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6F6F85',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    sectionText: {
        fontSize: 16,
        color: '#1E1E2D',
        lineHeight: 24,
    },
    skillItem: {
        fontSize: 16,
        color: '#1E1E2D',
        lineHeight: 24,
        marginBottom: 5,
    },
    link: {
        fontSize: 16,
        color: '#1155ccff',
        textDecorationLine: 'underline',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F1F6',
    },
    connectBtn: {
        backgroundColor: '#1155ccff',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileDetailScreen;
