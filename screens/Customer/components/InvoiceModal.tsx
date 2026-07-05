// screens/Customer/components/InvoiceModal.tsx
// Renders a clean order invoice and saves it to the gallery as an image
// (same captureRef + MediaLibrary flow as screens/InvoiceScreen.tsx).
import React, { useRef, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

import { useThemeContext } from 'context/ThemeProvider';
import { typo, fonts } from 'constants/design';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import type { CustomerOrder } from 'api/actions/customerOrderActions';
import { formatPrice } from './ProductCard';

interface Props {
  visible: boolean;
  order: CustomerOrder | null;
  onClose: () => void;
}

export default function InvoiceModal({ visible, order, onClose }: Props) {
  const { colors } = useThemeContext();
  const invoiceRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);

  if (!order) return null;

  const placedDate = new Date(order.placedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await MediaLibrary.requestPermissionsAsync();
      if (res.status !== 'granted') {
        Dialog.alert('Permission needed', 'Allow gallery access to save the invoice.');
        return;
      }

      const uri = await captureRef(invoiceRef, { format: 'jpg', quality: 1 });
      const fileUri = `${FileSystem.cacheDirectory}Invoice_${order.orderNumber}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: fileUri });

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('Invoices', asset, false);

      Toast.success('Invoice saved to gallery');
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      Toast.error('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.text + '55', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
          }}>
          {/* Sheet header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Invoice</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
            {/* Captured area */}
            <View
              ref={invoiceRef}
              collapsable={false}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
              }}>
              {/* Header */}
              <Text style={[typo.eyebrow, { color: colors.muted }]}>INVOICE</Text>
              <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 20, marginTop: 4 }}>
                {order.vendor?.businessName || 'Vendor'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                {order.orderNumber} · {placedDate}
              </Text>

              {/* Items */}
              <View
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                {order.items?.map((it) => (
                  <View
                    key={it.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}>
                    <Text style={{ color: colors.text, flex: 1, fontSize: 14 }} numberOfLines={1}>
                      {it.quantity} {it.unit} × {it.productName}
                    </Text>
                    <Text style={[typo.num, { color: colors.text, fontSize: 14 }]}>
                      {formatPrice(it.total)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Totals */}
              <View
                style={{
                  marginTop: 8,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.muted, fontSize: 14 }}>Subtotal</Text>
                  <Text style={[typo.num, { color: colors.text, fontSize: 14 }]}>
                    {formatPrice(order.subtotal)}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}>
                    Total
                  </Text>
                  <Text style={[typo.stat, { color: colors.text }]}>
                    {formatPrice(order.totalAmount)}
                  </Text>
                </View>
              </View>

              {/* Payment + delivery */}
              <View
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  Payment: {order.paymentMethod === 'cash' ? 'Cash on delivery' : order.paymentMethod}{' '}
                  · {order.paymentStatus}
                </Text>
                {order.deliveryAddress ? (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    Deliver to:{' '}
                    {[
                      order.deliveryAddress.street,
                      order.deliveryAddress.city,
                      order.deliveryAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Save (not captured) */}
            <Pressable
              disabled={saving}
              onPress={handleSave}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 15,
                alignItems: 'center',
                marginTop: 16,
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: saving ? 0.7 : 1,
              }}>
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="download-outline" size={20} color={colors.white} />
                  <Text
                    style={{ color: colors.white, fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                    Save to Gallery
                  </Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
