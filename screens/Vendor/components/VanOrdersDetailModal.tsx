// screens/Vendor/components/VanOrderDetailsModal.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchOrderDetails } from 'api/actions/orderActions';
import {
    formatPrice,
    formatShortDate,
    getStatusColor,
    getStatusLabel,
    getPaymentStatusColor,
    getPaymentStatusLabel,
} from 'types/order.types';
import { typo } from 'constants/design';
import OrderDetailModal from './OrderDetailModal';
import PaymentModal from './PaymentModal';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VanOrderDetailsModalProps {
    visible: boolean;
    orderId: number | null;
    onClose: () => void;
}

export default function VanOrderDetailsModal({
    visible,
    orderId,
    onClose,
}: VanOrderDetailsModalProps) {
    const { colors } = useThemeContext();
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState<number | null>(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedPaymentOrderId, setSelectedPaymentOrderId] = useState<number | null>(null);

    // Fetch order details
    const { data: orderData, isLoading } = useQuery({
        queryKey: ['orderDetail', orderId],
        queryFn: () => fetchOrderDetails(orderId!),
        enabled: !!orderId && visible,
    });

    const order = orderData?.data;
    
    const handleOpenOrderDetail = () => {
        setSelectedOrderIdForDetail(orderId);
        setDetailModalVisible(true);
    };

    const handleCloseDetailModal = () => {
        setDetailModalVisible(false);
        setSelectedOrderIdForDetail(null);
    };

    const handleEditOrder = (id: number) => {
        console.log('Edit order:', id);
        handleCloseDetailModal();
    };

    const handleRecordPayment = (id: number) => {
        console.log('Record payment for order:', id);
        handleCloseDetailModal();
        setSelectedPaymentOrderId(id);
        setPaymentModalVisible(true);
    };

    const handleClosePaymentModal = () => {
        setPaymentModalVisible(false);
        setSelectedPaymentOrderId(null);
    };

    if (!order && isLoading) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="mt-4" style={{ color: colors.muted }}>
                        Loading order details...
                    </Text>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
                {/* Header */}
                <View
                    className="flex-row items-center justify-between border-b px-4 py-3"
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity onPress={onClose} className="mr-3 p-1">
                            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-xl font-bold" style={{ color: colors.text }}>
                                {order?.orderNumber}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.muted }}>
                                Van Order Details
                            </Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                    {/* Customer Info Card */}
                    <View
                        className="mb-4 rounded-xl p-4"
                        style={{
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}>
                        <Text className="mb-3" style={[typo.eyebrow, { color: colors.muted }]}>
                            CUSTOMER
                        </Text>
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                            {order?.customer?.businessName || 'Unknown'}
                        </Text>
                        <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                            {order?.customer?.contactPerson}
                        </Text>
                        <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                            {order?.customer?.phone}
                        </Text>
                        {order?.deliveryAddress && (
                            <View className="mt-3 flex-row items-start">
                                <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.primary} />
                                <Text className="ml-2 flex-1 text-sm" style={{ color: colors.text }}>
                                    {order.deliveryAddress}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Order Status & Dates */}
                    <View className="mb-4 flex-row gap-2">
                        <View
                            className="flex-1 rounded-xl p-3"
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                            <Text className="text-xs" style={{ color: colors.muted }}>
                                Status
                            </Text>
                            <View className="mt-2 flex-row items-center">
                                <View
                                    className="rounded-full px-2 py-1"
                                    style={{ backgroundColor: getStatusColor(order?.status, colors) + '14' }}>
                                    <Text
                                        className="text-xs font-bold"
                                        style={{ color: getStatusColor(order?.status, colors) }}>
                                        {getStatusLabel(order?.status)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View
                            className="flex-1 rounded-xl p-3"
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                            <Text className="text-xs" style={{ color: colors.muted }}>
                                Order Date
                            </Text>
                            <Text className="mt-2 text-sm font-semibold" style={{ color: colors.text }}>
                                {formatShortDate(order?.orderDate)}
                            </Text>
                        </View>
                        {order?.deliveryDate && (
                            <View
                                className="flex-1 rounded-xl p-3"
                                style={{
                                    backgroundColor: colors.card,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}>
                                <Text className="text-xs" style={{ color: colors.muted }}>
                                    Delivery Date
                                </Text>
                                <Text className="mt-2 text-sm font-semibold" style={{ color: colors.text }}>
                                    {formatShortDate(order.deliveryDate)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Items Section */}
                    {order?.items && order.items.length > 0 && (
                        <View
                            className="mb-4 rounded-xl p-4"
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                            <Text className="mb-3" style={[typo.eyebrow, { color: colors.muted }]}>
                                ITEMS ({order.items.length})
                            </Text>
                            <View className="gap-2">
                                {order.items.map((item: any, idx: number) => (
                                    <View key={idx} className="flex-row items-center justify-between border-b pb-2"
                                        style={{ borderColor: colors.border }}>
                                        <View className="flex-1">
                                            <Text className="font-medium" style={{ color: colors.text }}>
                                                {item.productName}
                                            </Text>
                                            <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                                                Qty: {item.orderedQuantity} {item.unit}
                                            </Text>
                                            {item.rate && (
                                                <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                                                    Rate: {formatPrice(item.rate)}
                                                </Text>
                                            )}
                                        </View>
                                        {item.total && (
                                            <Text className="font-bold" style={{ color: colors.text }}>
                                                {formatPrice(item.total)}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Payment Information */}
                    <View className="mb-4 flex-row gap-2">
                        <View
                            className="flex-1 rounded-xl p-3"
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                            <Text className="text-xs" style={{ color: colors.muted }}>
                                Total Amount
                            </Text>
                            <Text className="mt-2 text-lg" style={[typo.num, { color: colors.primary }]}>
                                {formatPrice(order?.totalAmount)}
                            </Text>
                        </View>
                        <View
                            className="flex-1 rounded-xl p-3"
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                            <Text className="text-xs" style={{ color: colors.muted }}>
                                Payment Status
                            </Text>
                            <View className="mt-2">
                                <View
                                    className="rounded-md px-2 py-1"
                                    style={{ backgroundColor: getPaymentStatusColor(order?.paymentStatus, colors) + '14' }}>
                                    <Text
                                        className="text-xs font-semibold"
                                        style={{ color: getPaymentStatusColor(order?.paymentStatus, colors) }}>
                                        {getPaymentStatusLabel(order?.paymentStatus)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Balance Section */}
                    {parseFloat(order?.balanceAmount || 0) > 0 && (
                        <View
                            className="mb-4 rounded-xl p-4"
                            style={{
                                backgroundColor: colors.error + '10',
                                borderWidth: 1,
                                borderColor: colors.error,
                            }}>
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-sm" style={{ color: colors.muted }}>
                                        Amount Due
                                    </Text>
                                    <Text className="mt-1 text-2xl" style={[typo.num, { color: colors.error }]}>
                                        {formatPrice(order?.balanceAmount)}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="cash-multiple" size={32} color={colors.error} />
                            </View>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View className="gap-3">
                        <TouchableOpacity
                            onPress={handleOpenOrderDetail}
                            className="flex-row items-center justify-center rounded-xl py-3"
                            style={{ backgroundColor: colors.cta }}>
                            <MaterialCommunityIcons name="receipt" size={20} color={colors.onCta} />
                            <Text className="ml-2 font-semibold" style={{ color: colors.onCta }}>
                                Full Order Details
                            </Text>
                        </TouchableOpacity>
                        {parseFloat(order?.balanceAmount || 0) > 0 && (
                            <TouchableOpacity
                                onPress={() => handleRecordPayment(orderId!)}
                                className="flex-row items-center justify-center rounded-xl py-3"
                                style={{ backgroundColor: colors.success }}>
                                <MaterialCommunityIcons name="cash" size={20} color={colors.white} />
                                <Text className="ml-2 font-semibold" style={{ color: colors.white }}>
                                    Record Payment
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                {/* Order Detail Modal */}
                <OrderDetailModal
                    visible={detailModalVisible}
                    orderId={selectedOrderIdForDetail}
                    onClose={handleCloseDetailModal}
                    onEdit={handleEditOrder}
                    onRecordPayment={handleRecordPayment}
                />

                <PaymentModal
                    visible={paymentModalVisible}
                    orderId={selectedPaymentOrderId}
                    onClose={handleClosePaymentModal}
                />
            </SafeAreaView>
        </Modal>
    );
}