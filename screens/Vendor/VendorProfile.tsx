// screens/Vendor/VendorProfile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'utils/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchVendorProfile,
  updateVendorProfile,
  fetchVans,
  addVan,
  removeVan,
} from 'api/actions/vendorActions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function VendorProfile() {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Van management
  const [newVanName, setNewVanName] = useState('');
  const [showAddVan, setShowAddVan] = useState(false);
  const navigation = useNavigation();
  // Fetch profile
  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isRefetching,
  } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: fetchVendorProfile,
  });

  // Fetch vans
  const { data: vansData, refetch: refetchVans } = useQuery({
    queryKey: ['vans'],
    queryFn: fetchVans,
  });

  const profile = profileData?.data;
  const vans: string[] = vansData?.data || [];

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: updateVendorProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProfile'] });
      Toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    },
  });

  // Add van mutation
  const addVanMutation = useMutation({
    mutationFn: addVan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vans'] });
      Toast.success('Van added successfully');
      setNewVanName('');
      setShowAddVan(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add van');
    },
  });

  // Remove van mutation
  const removeVanMutation = useMutation({
    mutationFn: removeVan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vans'] });
      Toast.success('Van removed');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to remove van');
    },
  });

  const handleEdit = () => {
    setEditData({
      businessName: profile?.businessName || '',
      businessType: profile?.businessType || '',
      description: profile?.description || '',
      businessPhone: profile?.businessPhone || '',
      businessEmail: profile?.businessEmail || '',
      taxId: profile?.taxId || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleAddVan = () => {
    if (!newVanName.trim()) {
      Alert.alert('Error', 'Please enter a van name');
      return;
    }
    addVanMutation.mutate(newVanName.trim());
  };

  const handleRemoveVan = (vanName: string) => {
    Alert.alert('Remove Van', `Are you sure you want to remove "${vanName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeVanMutation.mutate(vanName),
      },
    ]);
  };

  const handleRefresh = () => {
    refetchProfile();
    refetchVans();
  };

  if (profileLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    // ✅ FIX: Wrap with KeyboardAvoidingView to handle keyboard covering inputs
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        // ✅ FIX: Enable keyboard dismiss on scroll and auto-scroll to focused input
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <SafeAreaView className="px-4 py-5">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <View
              className="flex-row items-center"
              >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-3 p-1">
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Business Profile
              </Text>
              <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                Manage your business information
              </Text>
              </View>
            </View>
            {!isEditing ? (
              <TouchableOpacity
                onPress={handleEdit}
                className="flex-row items-center rounded-lg px-4 py-2"
                style={{ backgroundColor: colors.primary }}>
                <MaterialIcons name="edit" size={16} color="#fff" />
                <Text className="ml-1 font-medium text-white">Edit</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleCancel}
                  className="rounded-lg px-4 py-2"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-row items-center rounded-lg px-4 py-2"
                  style={{
                    backgroundColor: colors.primary,
                    opacity: updateMutation.isPending ? 0.7 : 1,
                  }}>
                  {updateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="font-medium text-white">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Business Info Card */}
          <View
            className="mb-4 rounded-xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text className="mb-4 text-sm font-semibold" style={{ color: colors.muted }}>
              BUSINESS INFORMATION
            </Text>

            {/* Business Name */}
            <View className="mb-4">
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                Business Name
              </Text>
              {isEditing ? (
                <TextInput
                  value={editData.businessName}
                  onChangeText={(text) => setEditData({ ...editData, businessName: text })}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="Enter business name"
                  placeholderTextColor={colors.placeholder}
                />
              ) : (
                <Text className="text-base font-medium" style={{ color: colors.text }}>
                  {profile?.businessName || '-'}
                </Text>
              )}
            </View>

            {/* Business Type */}
            <View className="mb-4">
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                Business Type
              </Text>
              {isEditing ? (
                <TextInput
                  value={editData.businessType}
                  onChangeText={(text) => setEditData({ ...editData, businessType: text })}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="e.g., Vegetable Wholesaler"
                  placeholderTextColor={colors.placeholder}
                />
              ) : (
                <Text className="text-base" style={{ color: colors.text }}>
                  {profile?.businessType || '-'}
                </Text>
              )}
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                Description
              </Text>
              {isEditing ? (
                <TextInput
                  value={editData.description}
                  onChangeText={(text) => setEditData({ ...editData, description: text })}
                  multiline
                  numberOfLines={3}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Describe your business..."
                  placeholderTextColor={colors.placeholder}
                />
              ) : (
                <Text className="text-base" style={{ color: colors.text }}>
                  {profile?.description || '-'}
                </Text>
              )}
            </View>

            {/* Phone & Email Row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                  Phone
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editData.businessPhone}
                    onChangeText={(text) => setEditData({ ...editData, businessPhone: text })}
                    keyboardType="phone-pad"
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    placeholder="Phone"
                    placeholderTextColor={colors.placeholder}
                  />
                ) : (
                  <Text className="text-base" style={{ color: colors.text }}>
                    {profile?.businessPhone || '-'}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                  Email
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editData.businessEmail}
                    onChangeText={(text) => setEditData({ ...editData, businessEmail: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    placeholder="Email"
                    placeholderTextColor={colors.placeholder}
                  />
                ) : (
                  <Text className="text-base" style={{ color: colors.text }}>
                    {profile?.businessEmail || '-'}
                  </Text>
                )}
              </View>
            </View>

            {/* Tax ID */}
            <View className="mt-4">
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                Tax ID / NTN
              </Text>
              {isEditing ? (
                <TextInput
                  value={editData.taxId}
                  onChangeText={(text) => setEditData({ ...editData, taxId: text })}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="Tax ID"
                  placeholderTextColor={colors.placeholder}
                />
              ) : (
                <Text className="text-base" style={{ color: colors.text }}>
                  {profile?.taxId || '-'}
                </Text>
              )}
            </View>
          </View>

          {/* Vans Management */}
          <View
            className="mb-4 rounded-xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
                DELIVERY VANS
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddVan(!showAddVan)}
                className="flex-row items-center">
                <Ionicons name={showAddVan ? 'close' : 'add'} size={20} color={colors.primary} />
                <Text className="ml-1 text-sm font-medium" style={{ color: colors.primary }}>
                  {showAddVan ? 'Cancel' : 'Add Van'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Van Input */}
            {showAddVan && (
              <View className="mb-4 flex-row gap-2">
                <TextInput
                  value={newVanName}
                  onChangeText={setNewVanName}
                  className="flex-1 rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="Enter van name (e.g., Van 1)"
                  placeholderTextColor={colors.placeholder}
                  // ✅ FIX: Submit on enter key
                  onSubmitEditing={handleAddVan}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={handleAddVan}
                  disabled={addVanMutation.isPending}
                  className="items-center justify-center rounded-lg px-4"
                  style={{ backgroundColor: colors.primary }}>
                  {addVanMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Vans List */}
            {vans.length === 0 ? (
              <View className="items-center py-6">
                <Ionicons name="car-outline" size={32} color={colors.muted} />
                <Text className="mt-2 text-sm" style={{ color: colors.muted }}>
                  No vans added yet
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {vans.map((van, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between rounded-lg p-3"
                    style={{ backgroundColor: colors.background }}>
                    <View className="flex-row items-center">
                      <View
                        className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: colors.primary + '20' }}>
                        <Ionicons name="car" size={16} color={colors.primary} />
                      </View>
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {van}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveVan(van)}
                      disabled={removeVanMutation.isPending}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Status Card */}
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text className="mb-4 text-sm font-semibold" style={{ color: colors.muted }}>
              ACCOUNT STATUS
            </Text>
            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.text }}>Status</Text>
              <View
                className="rounded-full px-3 py-1"
                style={{
                  backgroundColor: profile?.status === 'active' ? '#d1fae5' : '#fef3c7',
                }}>
                <Text
                  className="text-sm font-medium capitalize"
                  style={{
                    color: profile?.status === 'active' ? '#059669' : '#d97706',
                  }}>
                  {profile?.status || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacer - Extra space for keyboard */}
          <View className="h-10" />
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
