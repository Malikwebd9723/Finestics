// screens/Customer/VendorDetailScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { EmptyState } from 'components/ui';
import { typo, fonts, radius } from 'constants/design';
import Toast from 'utils/Toast';
import { getVendor } from 'api/actions/marketplaceActions';
import { getConnections, requestConnection } from 'api/actions/connectionActions';
import type { ConnectionStatus } from 'api/actions/connectionActions';
import ProductCard from './components/ProductCard';
import ConnectionStatusBadge from './components/ConnectionStatusBadge';

export default function VendorDetailScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId: number = route.params?.vendorId;
  const queryClient = useQueryClient();

  const { data: vendor, isLoading, isError, error } = useQuery({
    queryKey: ['marketplace-vendor', vendorId],
    queryFn: () => getVendor(vendorId),
    enabled: !!vendorId,
  });

  const { data: connections } = useQuery({
    queryKey: ['customer-connections'],
    queryFn: () => getConnections(),
  });

  const connection = connections?.find((c) => c.vendor?.id === vendorId);
  const status: ConnectionStatus | undefined = connection?.connectionStatus;

  const connectMutation = useMutation({
    mutationFn: () => requestConnection(vendorId),
    onSuccess: () => {
      Toast.success('Connection request sent');
      queryClient.invalidateQueries({ queryKey: ['customer-connections'] });
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to send request'),
  });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !vendor) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Could not load vendor"
          subtitle={(error as Error)?.message || 'Please try again.'}
        />
      </View>
    );
  }

  const isConnected = status === 'active';
  const isPending = status === 'pending';
  const canRequest = !status || status === 'rejected' || status === 'blocked';

  const renderCta = () => {
    if (isConnected) {
      return (
        <Pressable
          onPress={() =>
            navigation.navigate('ProductCatalogScreen', {
              vendorId,
              vendorName: vendor.businessName,
            })
          }
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 15,
            alignItems: 'center',
          }}>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>
            Browse Catalog
          </Text>
        </Pressable>
      );
    }

    if (isPending) {
      return (
        <View
          style={{
            backgroundColor: colors.gray,
            borderRadius: 12,
            paddingVertical: 15,
            alignItems: 'center',
          }}>
          <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 16 }}>
            Request Pending
          </Text>
        </View>
      );
    }

    // canRequest
    return (
      <Pressable
        disabled={connectMutation.isPending}
        onPress={() => connectMutation.mutate()}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 15,
          alignItems: 'center',
          opacity: connectMutation.isPending ? 0.7 : 1,
        }}>
        {connectMutation.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>
            {status === 'rejected' ? 'Request Again' : 'Connect'}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Cover */}
        {vendor.coverImage ? (
          <Image
            source={{ uri: vendor.coverImage }}
            style={{ width: '100%', height: 140, backgroundColor: colors.gray }}
          />
        ) : (
          <View style={{ width: '100%', height: 100, backgroundColor: colors.primary + '15' }} />
        )}

        {/* Header card */}
        <View style={{ paddingHorizontal: 16, marginTop: -36 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.card,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {vendor.logo ? (
                <Image
                  source={{ uri: vendor.logo }}
                  style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: colors.gray }}
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    backgroundColor: colors.primary + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ color: colors.primary, fontSize: 26, fontFamily: fonts.bold }}>
                    {vendor.businessName?.[0]?.toUpperCase() || 'V'}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[typo.title, { color: colors.text, fontSize: 20 }]}>
                  {vendor.businessName}
                </Text>
                {!!vendor.businessType && (
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                    {vendor.businessType.charAt(0).toUpperCase() + vendor.businessType.slice(1)}
                  </Text>
                )}
                <View style={{ marginTop: 6 }}>
                  <ConnectionStatusBadge status={status} size="sm" />
                </View>
              </View>
            </View>

            {!!vendor.description && (
              <Text style={{ color: colors.text, fontSize: 14, marginTop: 14, lineHeight: 20 }}>
                {vendor.description}
              </Text>
            )}

            {status === 'rejected' && connection?.connectionRejectionReason ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 10 }}>
                Rejected: {connection.connectionRejectionReason}
              </Text>
            ) : null}

            <View style={{ marginTop: 16 }}>{renderCta()}</View>
          </View>
        </View>

        {/* Catalog preview */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            marginTop: 24,
            marginBottom: 12,
          }}>
          <Text style={[typo.eyebrow, { color: colors.muted }]}>PRODUCTS</Text>
          {(vendor.productCount ?? 0) > 0 && (
            <Pressable
              onPress={() =>
                navigation.navigate('ProductCatalogScreen', {
                  vendorId,
                  vendorName: vendor.businessName,
                })
              }>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>See all</Text>
            </Pressable>
          )}
        </View>

        {vendor.products && vendor.products.length > 0 ? (
          vendor.products.map((p) => <ProductCard key={p.id} product={p} />)
        ) : (
          <Text style={{ color: colors.muted, paddingHorizontal: 16 }}>
            This vendor has not listed any products yet.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
