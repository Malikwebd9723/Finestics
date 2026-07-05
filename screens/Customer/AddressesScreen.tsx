// screens/Customer/AddressesScreen.tsx
// Manage saved delivery addresses.
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { ListRow } from 'components/ui';
import { getAddresses, deleteAddress } from 'api/actions/customerOrderActions';
import AddAddressModal from './components/AddAddressModal';

export default function AddressesScreen() {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: addresses, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getAddresses,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => {
      Toast.success('Address deleted');
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to delete address'),
  });

  const confirmDelete = (id: number, label: string) => {
    Dialog.confirm('Delete address', `Remove "${label}" from your saved addresses?`, {
      destructive: true,
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const items = addresses ?? [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => {
          const line = [item.street, item.city, item.postalCode].filter(Boolean).join(', ');
          return (
            <View className="px-4">
              <ListRow
                icon="map-marker-outline"
                title={item.label || line}
                subtitle={item.label ? line : undefined}
                badge={item.isPrimary ? { label: 'Primary' } : undefined}
                divider={index > 0}
                onPress={() => confirmDelete(item.id, item.label || item.street)}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center px-8" style={{ paddingTop: 90 }}>
            <MaterialCommunityIcons name="map-marker-outline" size={56} color={colors.muted} />
            <Text className="mt-4 text-[16px] font-bold" style={{ color: colors.text }}>
              No saved addresses
            </Text>
            <Text
              className="mt-1.5 text-center text-[13px] font-medium"
              style={{ color: colors.muted }}>
              Add a delivery address to speed up checkout.
            </Text>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <Text
              className="mt-2 px-4 text-center text-[12px] font-medium"
              style={{ color: colors.muted }}>
              Tap an address to delete it.
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 110, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      />

      {/* Add address */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
        }}>
        <Pressable
          onPress={() => setAddOpen(true)}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16, marginLeft: 6 }}>
            Add Address
          </Text>
        </Pressable>
      </View>

      <AddAddressModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
        }}
      />
    </View>
  );
}
