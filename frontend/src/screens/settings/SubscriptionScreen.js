import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const SubscriptionScreen = ({ navigation }) => {
    const { user } = useAuth();
    const currentPlan = user?.plan || 'Starter';
    const [selectedPlan, setSelectedPlan] = useState(currentPlan);

    const plans = [
        {
            name: 'Starter',
            price: 'Free',
            period: 'PER MONTH',
            icon: 'shield-outline',
            features: [
                '10 Swipes / day',
                'Basic Location Filters',
                'Direct Chat after Match'
            ],
            color: '#F8F9FA',
            buttonText: 'Current Plan',
            isCurrent: currentPlan === 'Starter'
        },
        {
            name: 'Pro',
            price: '₹299/mo',
            period: 'PER MONTH',
            icon: 'flash',
            features: [
                'Unlimited Swipes',
                'Advanced Filters',
                '1 Profile Boost / week',
                'See who viewed you'
            ],
            color: '#F8F9FA',
            buttonText: 'Get Pro',
            isCurrent: currentPlan === 'Pro',
            isPopular: true,
            highlightColor: '#4d7cfe'
        },
        {
            name: 'Founders Club',
            price: '₹999/mo',
            period: 'PER MONTH',
            icon: 'star',
            features: [
                'Priority Discovery',
                'Incognito Mode',
                'Advanced Insights',
                'Direct Priority Support'
            ],
            color: '#F8F9FA',
            buttonText: 'Get Founders Club',
            isCurrent: currentPlan === 'Founders Club',
            highlightColor: '#ffb74d'
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerLogo}>FOUND.</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>BOOST YOUR ODDS.</Text>
                <Text style={styles.subtitle}>
                    The right co-founder is worth more than a subscription. Upgrade to find them faster.
                </Text>

                {plans.map((plan, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.planContainer}
                        activeOpacity={0.9}
                        onPress={() => setSelectedPlan(plan.name)}
                    >
                        {plan.isPopular && (
                            <View style={[styles.popularBadge, selectedPlan === plan.name && { backgroundColor: '#4d7cfe' }]}>
                                <Text style={styles.popularText}>MOST POPULAR</Text>
                            </View>
                        )}

                        <View style={[
                            styles.planCard,
                            selectedPlan === plan.name && { borderColor: '#4d7cfe', borderWidth: 2, shadowOpacity: 0.15 }
                        ]}>
                            <View style={styles.planHeader}>
                                <View style={styles.planIconTitle}>
                                    <View style={[styles.iconContainer, { backgroundColor: selectedPlan === plan.name ? 'rgba(77, 124, 254, 0.1)' : '#F0F0F0' }]}>
                                        <Ionicons
                                            name={plan.icon}
                                            size={24}
                                            color={selectedPlan === plan.name ? '#4d7cfe' : '#666'}
                                        />
                                    </View>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                </View>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.planPrice}>{plan.price}</Text>
                                    <Text style={styles.planPeriod}>{plan.period}</Text>
                                </View>
                            </View>

                            <View style={styles.featuresList}>
                                {plan.features.map((feature, fIdx) => (
                                    <View key={fIdx} style={styles.featureItem}>
                                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.planBtn,
                                    plan.isCurrent
                                        ? styles.currentBtn
                                        : { backgroundColor: '#4d7cfe' }
                                ]}
                                disabled={plan.isCurrent}
                            >
                                <Text style={[styles.planBtnText, plan.isCurrent && { color: '#888' }]}>
                                    {plan.buttonText}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Secure payment. Cancel anytime.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        height: 60,
    },
    closeBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerLogo: {
        color: '#000',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    title: {
        color: '#000',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 20,
        letterSpacing: 1,
    },
    subtitle: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    planContainer: {
        width: '100%',
        marginBottom: 20,
        alignItems: 'center',
    },
    popularBadge: {
        backgroundColor: '#999',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        position: 'absolute',
        top: -12,
        zIndex: 10,
    },
    popularText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    planCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    planIconTitle: {
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    planName: {
        color: '#000',
        fontSize: 24,
        fontWeight: '700',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    planPrice: {
        color: '#000',
        fontSize: 20,
        fontWeight: '700',
    },
    planPeriod: {
        color: '#999',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    featuresList: {
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        color: '#444',
        fontSize: 14,
        marginLeft: 10,
        fontWeight: '500',
    },
    planBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currentBtn: {
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    planBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    footerContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#999',
        fontSize: 12,
        marginTop: 20,
    }
});

export default SubscriptionScreen;
