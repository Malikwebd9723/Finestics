// screens/Vendor/VanOrdersScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Share,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchVans } from 'api/actions/vendorActions';
import { fetchOrdersByVan } from 'api/actions/orderActions';
import { formatPrice, getStatusColor, getStatusLabel } from 'types/order.types';
import OrderTableView, { ViewToggle } from './components/OrderTableView';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AggregatedProduct {
  productId: number;
  productName: string;
  unit: string;
  totalQuantity: number;
  avgPrice?: number;
}

export default function VanOrdersScreen({ navigation }: any) {
  const { colors } = useThemeContext();

  const [selectedVan, setSelectedVan] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Fetch vans
  const { data: vansData, isLoading: vansLoading } = useQuery({
    queryKey: ['vans'],
    queryFn: fetchVans,
  });

  const vans: string[] = vansData?.data || [];

  // Format date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  // Fetch orders for selected van
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['vanOrders', selectedVan, dateString],
    queryFn: () => fetchOrdersByVan(selectedVan!, dateString),
    enabled: !!selectedVan,
  });

  const orders = ordersData?.data || [];

  // Aggregate products from all orders
  const aggregatedProducts = useMemo(() => {
    const productMap = new Map<number, AggregatedProduct>();

    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const key = item.productId;
          const quantity = parseFloat(item.orderedQuantity) || 0;

          if (productMap.has(key)) {
            const existing = productMap.get(key)!;
            existing.totalQuantity += quantity;
          } else {
            productMap.set(key, {
              productId: item.productId,
              productName: item.productName,
              unit: item.unit,
              totalQuantity: quantity,
              avgPrice: parseFloat(item.price) || 0,
            });
          }
        });
      }
    });

    return Array.from(productMap.values());
  }, [orders]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      products: aggregatedProducts.length,
      quantity: aggregatedProducts.reduce((sum, p) => sum + p.totalQuantity, 0),
      orders: orders.length,
    };
  }, [aggregatedProducts, orders]);

  const toggleExpandProduct = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  // Get orders for a specific product
  const getOrdersForProduct = (productId: number) => {
    const productOrders: any[] = [];
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.productId === productId) {
            productOrders.push({
              ...order,
              itemQuantity: item.orderedQuantity,
              itemUnit: item.unit,
            });
          }
        });
      }
    });
    return productOrders;
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedOrderId(null);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleShareVanOrders = async () => {
    if (!selectedVan || aggregatedProducts.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let text = `🚐 Van Orders Report\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `📅 Report Date: ${dateStr} , ${timeStr}\n`;
    text += `🚐 Van: ${selectedVan}\n`;
    text += `📦 Total Orders: ${totals.orders}\n`;
    text += `📊 Total Products: ${totals.products}\n`;
    text += `📈 Total Quantity: ${totals.quantity}\n\n`;

    text += `PRODUCT BREAKDOWN\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    aggregatedProducts.forEach((product, index) => {
      text += `${index + 1}. ${product.productName}\n`;
      text += `   Total Qty: ${product.totalQuantity} ${product.unit}\n`;
      text += `\n`;
    });

    try {
      await Share.share({
        message: text,
        title: `Van Orders - ${selectedVan} (${formatDisplayDate(selectedDate)})`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b px-4 py-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Orders by Van
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Manage van assignments and deliveries
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShareVanOrders}
            disabled={!selectedVan || aggregatedProducts.length === 0}
            className="p-2"
            style={{ opacity: selectedVan && aggregatedProducts.length > 0 ? 1 : 0.5 }}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          {/* Date Selector */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center rounded-lg px-3 py-1.5"
            style={{ backgroundColor: colors.background }}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text className="ml-1.5 text-sm font-medium" style={{ color: colors.text }}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Van Selection Tabs */}
      <View style={{ backgroundColor: colors.card }}>
        {vansLoading ? (
          <View className="items-center py-4">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : vans.length === 0 ? (
          <View className="px-4 py-4">
            <Text className="text-center" style={{ color: colors.muted }}>
              No vans configured. Add vans in Business Profile.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, gap: 8 }}>
            {vans.map((van) => (
              <TouchableOpacity
                key={van}
                onPress={() => setSelectedVan(van)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: selectedVan === van ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: selectedVan === van ? colors.primary : colors.border,
                }}>
                <Text
                  className="font-medium"
                  style={{
                    color: selectedVan === van ? '#fff' : colors.text,
                  }}>
                  {van}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      {!selectedVan ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="car-outline" size={64} color={colors.muted} />
          <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
            Select a Van
          </Text>
          <Text className="mt-2 text-center" style={{ color: colors.muted }}>
            Choose a van above to view its assigned orders
          </Text>
        </View>
      ) : ordersLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.muted }}>
            Loading orders...
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Bar + View Toggle */}
          <View className="px-4 py-3">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
                {totals.products} products from {totals.orders} orders for {selectedVan}
              </Text>
              <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
            </View>

            <View className="flex-row gap-2">
              <View
                className="flex-1 rounded-xl p-3"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Products
                </Text>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  {totals.products}
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
                  Orders
                </Text>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  {totals.orders}
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
                  Total Qty
                </Text>
                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                  {totals.quantity}
                </Text>
              </View>
            </View>
          </View>

          {/* Products List - Card or Table View */}
          {viewMode === 'table' ? (
            <ProductTableView products={aggregatedProducts} colors={colors} />
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }>
              {aggregatedProducts.length === 0 ? (
                <View className="items-center py-16">
                  <MaterialIcons name="shopping-basket" size={48} color={colors.muted} />
                  <Text className="mt-4 text-center" style={{ color: colors.muted }}>
                    No products assigned to {selectedVan} for {formatDisplayDate(selectedDate)}
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {aggregatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      index={index + 1}
                      colors={colors}
                      isExpanded={expandedProduct === product.productId}
                      onToggle={() => toggleExpandProduct(product.productId)}
                      orders={getOrdersForProduct(product.productId)}
                      onViewOrder={handleViewOrder}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Import VanOrderDetailsModal */}
      {selectedOrderId && (
        <VanOrderDetailsModal
          visible={detailModalVisible}
          orderId={selectedOrderId}
          onClose={handleCloseDetailModal}
        />
      )}
    </SafeAreaView>
  );
}

// Import the modal component
import VanOrderDetailsModal from './components/VanOrdersDetailModal';

// Product Card Component
interface ProductCardProps {
  product: AggregatedProduct;
  index: number;
  colors: any;
  isExpanded: boolean;
  onToggle: () => void;
  orders: any[];
  onViewOrder: (orderId: number) => void;
}

function ProductCard({ product, index, colors, isExpanded, onToggle, orders, onViewOrder }: ProductCardProps) {
  return (
    <View
      className="overflow-hidden rounded-xl"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
      {/* Main Row */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} className="p-4">
        <View className="flex-row items-start">
          {/* Index */}
          <View
            className="mr-3 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}>
            <Text className="text-sm font-bold" style={{ color: colors.primary }}>
              {index}
            </Text>
          </View>

          {/* Product Info */}
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {product.productName}
            </Text>
            <View className="mt-1 flex-row items-center gap-3">
              <Text className="text-sm" style={{ color: colors.muted }}>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Text>
              <Text className="text-sm" style={{ color: colors.muted }}>
                Unit: {product.unit}
              </Text>
            </View>
          </View>

          {/* Quantity Badge */}
          <View className="items-end">
            <View className="rounded-lg px-3 py-1.5" style={{ backgroundColor: colors.primary }}>
              <Text className="font-bold text-white">
                {product.totalQuantity} {product.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Expand Indicator */}
        <View className="mt-2 flex-row items-center justify-center">
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.muted}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Orders List */}
      {isExpanded && (
        <View className="border-t px-4 pb-4 pt-2" style={{ borderColor: colors.border }}>
          <Text className="mb-3 text-xs font-semibold" style={{ color: colors.muted }}>
            ORDERS ({orders.length})
          </Text>
          <View className="gap-2">
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => onViewOrder(order.id)}
                className="flex-row items-center justify-between rounded-lg p-3"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary + '30' }}>
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {order.orderNumber}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {order.customer?.businessName || 'Unknown'}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {order.itemQuantity} {order.itemUnit}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Product Table View Component
interface ProductTableViewProps {
  products: AggregatedProduct[];
  colors: any;
}

function ProductTableView({ products, colors }: ProductTableViewProps) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      scrollEnabled={true}>
      <View style={{ backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
        {/* Table Header */}
        <View
          className="flex-row items-center px-4 py-3"
          style={{ backgroundColor: colors.primary + '20', borderBottomColor: colors.border, borderBottomWidth: 1 }}>
          <Text className="w-12 text-xs font-bold" style={{ color: colors.primary }}>
            #
          </Text>
          <Text className="flex-1 text-xs font-bold" style={{ color: colors.primary }}>
            Product
          </Text>
          <Text className="w-20 text-right text-xs font-bold" style={{ color: colors.primary }}>
            Qty
          </Text>
        </View>

        {/* Table Rows */}
        {products.map((product, index) => (
          <View
            key={product.productId}
            className="flex-row items-center px-4 py-3"
            style={{
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              borderBottomWidth: index < products.length - 1 ? 1 : 0,
            }}>
            <Text className="w-12 text-sm font-semibold" style={{ color: colors.muted }}>
              {index + 1}
            </Text>
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                {product.productName}
              </Text>
              <Text className="text-xs" style={{ color: colors.muted }}>
                {product.unit}
              </Text>
            </View>
            <Text className="w-20 text-right text-sm font-bold" style={{ color: colors.primary }}>
              {product.totalQuantity}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}