import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

/* ---------------- CONSTANTS ---------------- */

const INDUSTRIES = [
    'FinTech', 'EdTech', 'HealthTech', 'AgriTech', 'FoodTech',
    'E-commerce', 'SaaS / Enterprise Software', 'AI / Data / ML',
    'ClimateTech', 'Clean Energy', 'Mobility', 'PropTech',
    'Logistics & Supply Chain', 'HRTech', 'AdTech / MarTech',
    'Media / Entertainment', 'Gaming'
];

const SKILLS = [
    'Software Engineer', 'Product Manager', 'Designer', 'Marketing',
    'Sales', 'Operations', 'Finance', 'Legal', 'Data Scientist',
    'HR / Recruiting', 'Founder / CEO', 'Investor'
];

const DISTANCE_OPTIONS = [
    { label: 'Under 2 km', value: 2 },
    { label: 'Under 10 km', value: 10 },
    { label: 'Under 20 km', value: 20 },
    { label: 'Under 50 km', value: 50 },
    { label: 'Under 100 km', value: 100 },
    { label: 'Anywhere', value: 1000 },
];

/* ---------------- SCREEN ---------------- */

const FiltersScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Industry');

    const [settings, setSettings] = useState({
        maxDistance: 100,
        preferredIndustries: [],
        preferredSkills: [],
        goalOverride: null,
    });

    /* ---------- STATUS BAR FIX ---------- */
    useEffect(() => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor('#FFFFFF');
            StatusBar.setTranslucent(false);
        }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await API.get('/settings/discover');
            if (res.data?.discoverSettings) {
                setSettings(res.data.discoverSettings);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await API.put('/settings/discover', settings);
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleItem = (field, value) => {
        const list = settings[field];
        setSettings({
            ...settings,
            [field]: list.includes(value)
                ? list.filter(i => i !== value)
                : [...list, value],
        });
    };

    /* ---------- RIGHT CONTENT ---------- */

    const renderContent = () => {
        if (selectedCategory === 'Industry') {
            return (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {INDUSTRIES.map(item => (
                        <TouchableOpacity
                            key={item}
                            style={styles.optionRow}
                            onPress={() => toggleItem('preferredIndustries', item)}
                        >
                            <Text style={[
                                styles.optionText,
                                settings.preferredIndustries.includes(item) && styles.activeText
                            ]}>
                                {item}
                            </Text>
                            {settings.preferredIndustries.includes(item) && (
                                <Ionicons name="checkmark" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        }

        if (selectedCategory === 'Skills') {
            return (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {SKILLS.map(item => (
                        <TouchableOpacity
                            key={item}
                            style={styles.optionRow}
                            onPress={() => toggleItem('preferredSkills', item)}
                        >
                            <Text style={[
                                styles.optionText,
                                settings.preferredSkills.includes(item) && styles.activeText
                            ]}>
                                {item}
                            </Text>
                            {settings.preferredSkills.includes(item) && (
                                <Ionicons name="checkmark" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        }

        if (selectedCategory === 'Location') {
            return (
                <View>
                    {DISTANCE_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.distanceCard,
                                settings.maxDistance === opt.value && styles.distanceCardActive
                            ]}
                            onPress={() => setSettings({ ...settings, maxDistance: opt.value })}
                        >
                            <Text style={[
                                styles.distanceText,
                                settings.maxDistance === opt.value && styles.activeText
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    /* ---------------- UI ---------------- */

    return (
        <SafeAreaView style={styles.safe}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.logo}>FOUND.</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.body}>
                {/* SIDEBAR */}
                <View style={styles.sidebar}>
                    <Text style={styles.filtersTitle}>Filters</Text>

                    {['Industry', 'Skills', 'Location'].map(item => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.sidebarItem,
                                selectedCategory === item && styles.sidebarActive
                            ]}
                            onPress={() => setSelectedCategory(item)}
                        >
                            <Text style={[
                                styles.sidebarText,
                                selectedCategory === item && styles.activeText
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.sidebarFooter}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.doneBtn} onPress={handleSave}>
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CONTENT */}
                <View style={styles.content}>
                    {renderContent()}
                </View>
            </View>
        </SafeAreaView>
    );
};

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    logo: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    body: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
    },
    sidebar: {
        width: SCREEN_WIDTH * 0.3,
        padding: 15,
        borderRightWidth: 1,
        borderRightColor: '#EEE',
        backgroundColor: '#FFFFFF',
    },
    filtersTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
    },
    sidebarItem: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    sidebarActive: {
        backgroundColor: '#F0F7FF',
    },
    sidebarText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '600',
    },
    sidebarFooter: {
        marginTop: 'auto',
    },
    cancelBtn: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        marginBottom: 10,
        alignItems: 'center',
    },
    cancelText: {
        color: '#555',
        fontWeight: '600',
    },
    doneBtn: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    doneText: {
        color: '#FFF',
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    optionText: {
        fontSize: 14,
        color: '#444',
    },
    activeText: {
        color: '#007AFF',
        fontWeight: '700',
    },
    distanceCard: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 12,
    },
    distanceCardActive: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    distanceText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default FiltersScreen;
