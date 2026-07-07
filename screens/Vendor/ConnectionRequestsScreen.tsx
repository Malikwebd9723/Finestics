// screens/Vendor/ConnectionRequestsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import Toast from 'utils/Toast';
import {
  getConnectionRequests,
  approveConnection,
  rejectConnection,
} from 'api/actions/connectionActions';
import type {
  ConnectionRequest,
  ApproveConnectionPayload,
} from 'api/actions/connectionActions';
import ApproveConnectionModal from './components/ApproveConnectionModal';

export default function ConnectionRequestsScreen() {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<ConnectionRequest | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-connection-requests'],
    queryFn: () => getConnectionRequests('pending'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendor-connection-requests'] });
  };

  const approveMutation = useMutation({
    mutationFn: (payload: ApproveConnectionPayload) =>
      approveConnection(selected!.id, payload),
    onSuccess: () => {
      Toast.success('Connection approved');
      setApproveOpen(false);
      setSelected(null);
      invalidate();
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectConnection(selected!.id, rejectReason.trim() || undefined),
    onSuccess: () => {
      Toast.success('Request rejected');
      setRejectOpen(false);
      setRejectReason('');
      setSelected(null);
      invalidate();
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to reject'),
  });

  const requests = data ?? [];

  const renderItem = ({ item }: { item: ConnectionRequest }) => {
    const name = item.customerUser
      ? `${item.customerUser.firstName} ${item.customerUser.lastName}`.trim()
      : item.businessName || 'Customer';
    const initial = name?.[0]?.toUpperCase() || 'C';

    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 14,
          marginHorizontal: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary + '14',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>
              {initial}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{name}</Text>
            {!!item.customerUser?.email && (
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                {item.customerUser.email}
              </Text>
            )}
            {!!item.customerUser?.phone && (
              <Text style={{ color: colors.muted, fontSize: 13 }}>{item.customerUser.phone}</Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Pressable
            onPress={() => {
              setSelected(item);
              setRejectReason('');
              setRejectOpen(true);
            }}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.error,
            }}>
            <Text style={{ color: colors.error, fontWeight: '700' }}>Reject</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setSelected(item);
              setApproveOpen(true);
            }}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: colors.cta,
            }}>
            <Text style={{ color: colors.onCta, fontWeight: '700' }}>Approve</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
              <MaterialCommunityIcons name="account-clock-outline" size={56} color={colors.muted} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
                No pending requests
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                Customer connection requests will appear here.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Approve modal */}
      <ApproveConnectionModal
        visible={approveOpen}
        request={selected}
        submitting={approveMutation.isPending}
        onClose={() => setApproveOpen(false)}
        onSubmit={(payload) => approveMutation.mutate(payload)}
      />

      {/* Reject modal */}
      <Modal visible={rejectOpen} transparent animationType="fade" onRequestClose={() => setRejectOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'center', backgroundColor: '#00000080', padding: 24 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                Reject Request
              </Text>
              <Pressable onPress={() => setRejectOpen(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
              Optionally tell the customer why.
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.placeholder}
              multiline
              style={{
                backgroundColor: colors.background,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                color: colors.text,
                height: 80,
                textAlignVertical: 'top',
              }}
            />
            <Pressable
              disabled={rejectMutation.isPending}
              onPress={() => rejectMutation.mutate()}
              style={{
                backgroundColor: colors.error,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 16,
                opacity: rejectMutation.isPending ? 0.7 : 1,
              }}>
              {rejectMutation.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>
                  Confirm Reject
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
