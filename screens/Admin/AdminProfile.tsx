// screens/Admin/AdminProfile.tsx
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAdminProfile, updateAdminProfile } from 'api/actions/adminActions';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { useNavigation } from '@react-navigation/native';

export default function AdminProfile() {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Fetch profile
  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isRefetching,
  } = useQuery({
    queryKey: ['adminProfile'],
    queryFn: fetchAdminProfile,
  });

  const profile = profileData?.data;

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: updateAdminProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
      Toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      Dialog.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleEdit = () => {
    setEditData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchProfile}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <SafeAreaView className="px-4 py-5">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                  My Profile
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                  Manage your account information
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

          {/* Profile Avatar */}
          <View className="items-center mb-6">
            <View
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + '20' }}>
              <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
                {profile?.firstName?.charAt(0) || ''}
                {profile?.lastName?.charAt(0) || ''}
              </Text>
            </View>
            <Text className="mt-3 text-xl font-bold" style={{ color: colors.text }}>
              {profile?.firstName} {profile?.lastName}
            </Text>
            <View
              className="mt-2 px-3 py-1 rounded-full"
              style={{ backgroundColor: '#8b5cf6' + '20' }}>
              <Text className="text-sm font-semibold uppercase" style={{ color: '#8b5cf6' }}>
                {profile?.role || 'Admin'}
              </Text>
            </View>
          </View>

          {/* Personal Information */}
          <View
            className="mb-4 rounded-xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text className="mb-4 text-sm font-semibold" style={{ color: colors.muted }}>
              PERSONAL INFORMATION
            </Text>

            {/* First Name */}
            <View className="mb-4">
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                First Name
              </Text>
              {isEditing ? (
                <TextInput
                  value={editData.firstName}
                  onChangeText={(text) => setEditData({ ...editData, firstName: text })}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="Enter first name"
                  placeholderTextColor={colors.muted}
                />
              ) : (
                <Text className="text-base font-medium" style={{ color: colors.text }}>
                  {profile?.firstName || '-'}
                </Text>
              )}
            </View>

            {/* Last Name */}
            <View className="mb-4">
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                Last Name
              </Text>
              {isEditing ? (
                <TextInput
                  value={editData.lastName}
                  onChangeText={(text) => setEditData({ ...editData, lastName: text })}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="Enter last name"
                  placeholderTextColor={colors.muted}
                />
              ) : (
                <Text className="text-base font-medium" style={{ color: colors.text }}>
                  {profile?.lastName || '-'}
                </Text>
              )}
            </View>

            {/* Email (non-editable) */}
            <View className="mb-4">
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                Email
              </Text>
              <View className="flex-row items-center">
                <Text className="text-base" style={{ color: colors.text }}>
                  {profile?.email || '-'}
                </Text>
                {profile?.isEmailVerified && (
                  <View className="ml-2 flex-row items-center">
                    <MaterialIcons name="verified" size={14} color={colors.success} />
                    <Text className="ml-0.5 text-xs" style={{ color: colors.success }}>
                      Verified
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Phone */}
            <View>
              <Text className="mb-1 text-xs font-medium" style={{ color: colors.muted }}>
                Phone
              </Text>
              {isEditing ? (
                <TextInput
                  value={editData.phone}
                  onChangeText={(text) => setEditData({ ...editData, phone: text })}
                  keyboardType="phone-pad"
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.muted}
                />
              ) : (
                <Text className="text-base" style={{ color: colors.text }}>
                  {profile?.phone || 'Not provided'}
                </Text>
              )}
            </View>
          </View>

          {/* Account Information */}
          <View
            className="mb-4 rounded-xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text className="mb-4 text-sm font-semibold" style={{ color: colors.muted }}>
              ACCOUNT INFORMATION
            </Text>

            {/* Role */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={{ color: colors.muted }}>Role</Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: '#8b5cf6' + '20' }}>
                <Text className="text-sm font-medium uppercase" style={{ color: '#8b5cf6' }}>
                  {profile?.role || 'Admin'}
                </Text>
              </View>
            </View>

            {/* Account Status */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={{ color: colors.muted }}>Account Status</Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    profile?.accountStatus === 'active' ? colors.success + '20' : colors.error + '20',
                }}>
                <Text
                  className="text-sm font-medium capitalize"
                  style={{
                    color: profile?.accountStatus === 'active' ? colors.success : colors.error,
                  }}>
                  {profile?.accountStatus || 'Unknown'}
                </Text>
              </View>
            </View>

            {/* Last Login */}
            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.muted }}>Last Login</Text>
              <Text className="text-sm" style={{ color: colors.text }}>
                {formatDate(profile?.lastLoginAt)}
              </Text>
            </View>
          </View>

          {/* Account Dates */}
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text className="mb-4 text-sm font-semibold" style={{ color: colors.muted }}>
              DATES
            </Text>

            <View className="mb-3 flex-row items-center justify-between">
              <Text style={{ color: colors.muted }}>Account Created</Text>
              <Text className="text-sm" style={{ color: colors.text }}>
                {formatDate(profile?.createdAt)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.muted }}>Last Updated</Text>
              <Text className="text-sm" style={{ color: colors.text }}>
                {formatDate(profile?.updatedAt)}
              </Text>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View className="h-10" />
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
