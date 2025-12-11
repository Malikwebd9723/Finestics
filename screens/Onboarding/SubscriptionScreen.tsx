import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../../context/ThemeProvider';
import { apiRequest } from 'api/clients';
import { useNavigation } from '@react-navigation/native';

interface Plan {
  id: number;
  name: string;
  planType: string;
  duration: number;
  price: string;
  currency: string;
  description: string;
  features: string[];
  isActive: boolean;
}

const SubscriptionScreen = () => {
  const { colors } = useThemeContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();

  const fetchPlans = async () => {
    try {
      const res = await apiRequest('/onboarding/payment-plans', 'GET');
      console.log(res.data.data.plans);
      const fetchedPlans = res.data.data.plans;
      if (res.success && fetchedPlans) {
        setPlans(fetchedPlans);
      }
    } catch (e) {
      console.log('Failed to load plans:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // SUBMIT SELECTED PLAN TO BACKEND
  const submitSelectedPlan = async () => {
    try {
      setSubmitting(true);
      await apiRequest(
        '/onboarding/payment-plan',
        'POST',
        selected !== null
          ? {
              selectedPlanId: selected,
            }
          : {}
      );
      ToastAndroid.show('Plan selected successfully!', ToastAndroid.SHORT);
      navigation.navigate('SubmitOnboardingScreen' as never);
    } catch (e) {
      console.log('Failed to submit selected plan:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // Local navigation actions (can be replaced later)
  const onBack = () => console.log('Back pressed');
  const onSkip = () => submitSelectedPlan();
  const onNext = () => submitSelectedPlan();

  const cardShadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 px-6 pt-10" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-center text-3xl font-bold" style={{ color: colors.text }}>
          Subscription Plans
        </Text>

        <Text className="mt-2 text-center text-base" style={{ color: colors.text }}>
          Choose a plan to start using FinFlow with full features.
        </Text>

        {/* Skip Button */}
        <TouchableOpacity onPress={onSkip} className="mt-4 flex-row items-center self-end">
          <Text className="text-base" style={{ color: colors.text }}>
            Skip
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Dynamically Render Plans */}
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            onPress={() => setSelected(plan.id)}
            className="mt-6 w-full rounded-2xl p-4"
            style={{ backgroundColor: colors.card, ...cardShadow }}>
            {/* Header */}
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name={selected === plan.id ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={colors.text}
                />
                <Text className="ml-2 text-xl font-semibold" style={{ color: colors.text }}>
                  {plan.name}
                </Text>
              </View>

              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {plan.currency} {plan.price}
              </Text>
            </View>

            {/* Duration */}
            <View className="mt-1 flex-row justify-between">
              <Text style={{ color: colors.text }}>Duration</Text>
              <Text style={{ color: colors.text }}>{plan.duration} Month</Text>
            </View>

            {/* Features */}
            <Text className="mt-3 font-semibold" style={{ color: colors.text }}>
              Features:
            </Text>

            {plan.features.map((f, index) => (
              <View key={index} className="mt-1 flex-row items-center">
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text className="ml-2" style={{ color: colors.text }}>
                  {f}
                </Text>
              </View>
            ))}

            {/* Description */}
            {plan.description && (
              <Text className="mt-3 text-sm italic" style={{ color: colors.text }}>
                {plan.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Footer Buttons */}
        <View className="mb-10 mt-10 flex-row justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="flex-1 items-center rounded-xl py-3"
            style={{ backgroundColor: colors.primary }}>
            <Text style={{ color: colors.white, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            disabled={!selected || submitting}
            className="ml-3 flex-1 items-center rounded-xl py-3"
            style={{
              backgroundColor: selected ? colors.primary : colors.card,
              opacity: selected ? 1 : 0.4,
            }}>
            <Text style={{ color: selected ? colors.white : colors.text, fontWeight: '600' }}>
              {submitting ? 'Please wait…' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubscriptionScreen;
