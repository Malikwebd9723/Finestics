// screens/Admin/components/VendorActionsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
} from 'api/actions/adminActions';
import Snackbar, { useSnackbar } from 'components/Snackbar';

const { height } = Dimensions.get('window');

interface VendorActionsModalProps {
  visible: boolean;
  vendorId: number | null;
  actionType: 'approve' | 'reject' | 'suspend' | 'reactivate';
  onClose: () => void;
}

export default function VendorActionsModal({
  visible,
  vendorId,
  actionType,
  onClose,
}: VendorActionsModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(height));
  const [reason, setReason] = useState('');
  const snackbar = useSnackbar();

  const needsReason = actionType === 'reject' || actionType === 'suspend';

  useEffect(() => {
    if (visible) {
      setReason('');
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSuccess = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
    snackbar.showSuccess(message);
    setTimeout(() => onClose(), 500);
  };

  const handleError = (error: any, defaultMessage: string) => {
    const errorMessage = error?.data?.error?.message || error?.data?.message || error?.message || defaultMessage;
    snackbar.showError(errorMessage);
  };

  const approveMutation = useMutation({
    mutationFn: approveVendor,
    onSuccess: (response) => {
      if (response.success) {
        handleSuccess(response.data?.message || 'Vendor approved successfully');
      } else {
        handleError(response, 'Failed to approve vendor');
      }
    },
    onError: (error: any) => {
      handleError(error, 'Failed to approve vendor');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectVendor(id, reason),
    onSuccess: (response) => {
      if (response.success) {
        handleSuccess(response.data?.message || 'Vendor rejected successfully');
      } else {
        handleError(response, 'Failed to reject vendor');
      }
    },
    onError: (error: any) => {
      handleError(error, 'Failed to reject vendor');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => suspendVendor(id, reason),
    onSuccess: (response) => {
      if (response.success) {
        handleSuccess(response.data?.message || 'Vendor suspended successfully');
      } else {
        handleError(response, 'Failed to suspend vendor');
      }
    },
    onError: (error: any) => {
      handleError(error, 'Failed to suspend vendor');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateVendor,
    onSuccess: (response) => {
      if (response.success) {
        handleSuccess(response.data?.message || 'Vendor reactivated successfully');
      } else {
        handleError(response, 'Failed to reactivate vendor');
      }
    },
    onError: (error: any) => {
      handleError(error, 'Failed to reactivate vendor');
    },
  });

  const handleConfirm = () => {
    if (!vendorId) return;

    if (needsReason && !reason.trim()) {
      snackbar.showWarning('Please provide a reason');
      return;
    }

    switch (actionType) {
      case 'approve':
        approveMutation.mutate(vendorId);
        break;
      case 'reject':
        rejectMutation.mutate({ id: vendorId, reason: reason.trim() });
        break;
      case 'suspend':
        suspendMutation.mutate({ id: vendorId, reason: reason.trim() });
        break;
      case 'reactivate':
        reactivateMutation.mutate(vendorId);
        break;
    }
  };

  const isLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    suspendMutation.isPending ||
    reactivateMutation.isPending;

  const getActionConfig = () => {
    switch (actionType) {
      case 'approve':
        return {
          title: 'Approve Vendor',
          description: 'Are you sure you want to approve this vendor? They will be able to start selling on the platform.',
          icon: 'check-circle',
          color: colors.success,
          buttonText: 'Approve',
        };
      case 'reject':
        return {
          title: 'Reject Vendor',
          description: 'Please provide a reason for rejecting this vendor application.',
          icon: 'cancel',
          color: colors.error,
          buttonText: 'Reject',
        };
      case 'suspend':
        return {
          title: 'Suspend Vendor',
          description: 'Please provide a reason for suspending this vendor. They will be unable to sell until reactivated.',
          icon: 'block',
          color: colors.error,
          buttonText: 'Suspend',
        };
      case 'reactivate':
        return {
          title: 'Reactivate Vendor',
          description: 'Are you sure you want to reactivate this vendor? They will be able to resume selling.',
          icon: 'refresh',
          color: colors.success,
          buttonText: 'Reactivate',
        };
    }
  };

  const config = getActionConfig();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <Animated.View
          className="w-full rounded-3xl p-6"
          style={{
            backgroundColor: colors.card,
            maxWidth: 400,
            transform: [{ translateY: slideAnim }],
          }}>
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <View
              className="h-12 w-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: config.color + '20' }}>
              <MaterialIcons name={config.icon as any} size={28} color={config.color} />
            </View>
            <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
              {config.title}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.background }}>
              <MaterialIcons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Description */}
          <Text className="text-sm mb-4" style={{ color: colors.muted }}>
            {config.description}
          </Text>

          {/* Reason Input (for reject/suspend) */}
          {needsReason && (
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Enter reason..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              className="rounded-2xl p-4 mb-4 text-base"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                textAlignVertical: 'top',
                minHeight: 100,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={isLoading}
              className="flex-1 py-3 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={isLoading || (needsReason && !reason.trim())}
              className="flex-1 py-3 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: config.color,
                opacity: isLoading || (needsReason && !reason.trim()) ? 0.5 : 1,
              }}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">{config.buttonText}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          message={snackbar.message}
          type={snackbar.type}
          onDismiss={snackbar.hideSnackbar}
        />
      </View>
    </Modal>
  );
}
