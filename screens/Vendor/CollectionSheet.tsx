// screens/Vendor/CollectionSheet.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'utils/Toast';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchCollectionSheet } from 'api/actions/orderActions';
import { formatPrice } from 'types/order.types';
import { ViewToggle } from './components/OrderTableView';

interface CollectionItem {
  productId: number;
  productName: string;
  unit: string;
  totalQuantity: number;
  avgBuyingPrice: number;
  orders: {
    orderId: number;
    orderNumber: string;
    customerName: string;
    quantity: number;
  }[];
}

interface CollectionSheetData {
  date: string;
  totalOrders: number;
  items: CollectionItem[];
}

export default function CollectionSheet() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Expanded items state
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [shareMenuVisible, setShareMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Format date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  // Fetch collection sheet
  const { data, isLoading, error, refetch, isRefetching } = useQuery<{ data: CollectionSheetData }>(
    {
      queryKey: ['collectionSheet', dateString],
      queryFn: () => fetchCollectionSheet(dateString),
    }
  );

  const collectionSheet = data?.data;

  // Calculate totals
  const totals = useMemo(() => {
    if (!collectionSheet?.items) return { items: 0, quantity: 0, cost: 0 };

    return collectionSheet.items.reduce(
      (acc, item) => ({
        items: acc.items + 1,
        quantity: acc.quantity + item.totalQuantity,
        cost: acc.cost + item.totalQuantity * item.avgBuyingPrice,
      }),
      { items: 0, quantity: 0, cost: 0 }
    );
  }, [collectionSheet]);

  // Toggle item expansion
  const toggleExpand = (productId: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Date change handler
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Build share text
  const buildShareText = (includeCosts: boolean) => {
    if (!collectionSheet?.items?.length) return '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const sortedItems = [...collectionSheet.items].sort((a, b) => b.totalQuantity - a.totalQuantity);

    let text = `📅 Report Date: ${dateStr} , ${timeStr}\n`;
    text += `📦 Total Orders: ${collectionSheet.totalOrders}\n`;
    text += `📊 Total Products: ${totals.items}\n`;
    text += `📈 Total Quantity: ${totals.quantity}\n`;
    if (includeCosts) {
      text += `💰 Est. Total Cost: ${formatPrice(totals.cost)}\n`;
    }
    text += `\nPRODUCT BREAKDOWN (High → Low)\n`;
    text += `──────────────────\n\n`;

    sortedItems.forEach((item) => {
      text += `${item.productName} = ${item.totalQuantity}\n`;
      if (includeCosts) {
        text += `   Est. Cost: ${formatPrice(item.totalQuantity * item.avgBuyingPrice)}\n`;
      }
    });

    return text;
  };

  // Share collection sheet
  const handleShare = async (includeCosts: boolean) => {
    setShareMenuVisible(false);
    const text = buildShareText(includeCosts);
    if (!text) return;
    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Copy to clipboard
  const handleCopy = async (includeCosts: boolean) => {
    setShareMenuVisible(false);
    const text = buildShareText(includeCosts);
    if (!text) return;
    try {
      await Clipboard.setStringAsync(text);
      Toast.success('Copied to clipboard');
    } catch (error) {
      Toast.error('Failed to copy');
    }
  };

  // Format date for display
  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b px-4 py-3"
        style={{ borderColor: colors.border }}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Collection Sheet
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Items to collect from market
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          onPress={() => setShareMenuVisible(true)}
          disabled={!collectionSheet?.items?.length}
          className="p-2"
          style={{ opacity: collectionSheet?.items?.length ? 1 : 0.5 }}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ backgroundColor: colors.card }}>
        <TouchableOpacity
          onPress={() => navigateDate('prev')}
          className="rounded-full p-2"
          style={{ backgroundColor: colors.background }}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="flex-row items-center rounded-lg px-4 py-2"
          style={{ backgroundColor: colors.background }}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text className="ml-2 font-semibold" style={{ color: colors.text }}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={20} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateDate('next')}
          className="rounded-full p-2"
          style={{ backgroundColor: colors.background }}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar + View Toggle */}
      {collectionSheet && (
        <View className="px-4 py-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
              {totals.items} items from {collectionSheet.totalOrders} orders
            </Text>
            <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
          </View>

          <View className="flex-row gap-2">
            <View
              className="flex-1 rounded-xl p-3"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Orders
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {collectionSheet.totalOrders}
              </Text>
            </View>
            <View
              className="flex-1 rounded-xl p-3"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Items
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {totals.items}
              </Text>
            </View>
            <View
              className="flex-1 rounded-xl p-3"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Est. Cost
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                {formatPrice(totals.cost)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {viewMode === 'table' && collectionSheet?.items?.length ? (
        <CollectionTableView items={collectionSheet.items} colors={colors} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          {isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.muted }}>
                Loading collection sheet...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center py-20">
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text className="mt-4 text-center" style={{ color: colors.text }}>
                Failed to load collection sheet
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-4 rounded-lg px-6 py-2"
                style={{ backgroundColor: colors.primary }}>
                <Text className="font-semibold text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !collectionSheet?.items?.length ? (
            <View className="items-center py-20">
              <MaterialIcons name="shopping-basket" size={64} color={colors.muted} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                No items to collect
              </Text>
              <Text className="mt-2 px-8 text-center" style={{ color: colors.muted }}>
                No orders scheduled for delivery on {formatDisplayDate(selectedDate)}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {collectionSheet.items.map((item, index) => (
                <CollectionItemCard
                  key={item.productId}
                  item={item}
                  index={index + 1}
                  isExpanded={expandedItems.has(item.productId)}
                  onToggle={() => toggleExpand(item.productId)}
                  colors={colors}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Share Options Menu */}
      <Modal
        visible={shareMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareMenuVisible(false)}>
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShareMenuVisible(false)}>
          <Pressable
            className="mx-6 w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: colors.card }}
            onPress={(e) => e.stopPropagation()}>
            <Text className="mb-4 text-lg font-bold" style={{ color: colors.text }}>
              Share Collection Sheet
            </Text>
            <TouchableOpacity
              onPress={() => handleShare(true)}
              className="mb-3 flex-row items-center rounded-xl p-4"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <MaterialIcons name="share" size={22} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Share With Costs
                </Text>
                <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                  Includes estimated costs and prices
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleShare(false)}
              className="mb-3 flex-row items-center rounded-xl p-4"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <MaterialIcons name="share" size={22} color={colors.muted} />
              <View className="ml-3 flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Share Without Costs
                </Text>
                <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                  Only items and quantities (for workers)
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCopy(true)}
              className="mb-3 flex-row items-center rounded-xl p-4"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <MaterialIcons name="content-copy" size={22} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Copy With Costs
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCopy(false)}
              className="mb-3 flex-row items-center rounded-xl p-4"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <MaterialIcons name="content-copy" size={22} color={colors.muted} />
              <View className="ml-3 flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Copy Without Costs
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShareMenuVisible(false)}
              className="items-center rounded-lg py-3"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <Text className="font-semibold" style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

// Collection Table View
function CollectionTableView({ items, colors }: { items: CollectionItem[]; colors: any }) {
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
          <Text className="w-10 text-xs font-bold" style={{ color: colors.primary }}>
            #
          </Text>
          <Text className="flex-1 text-xs font-bold" style={{ color: colors.primary }}>
            Product
          </Text>
          <Text className="w-20 text-right text-xs font-bold" style={{ color: colors.primary }}>
            Qty
          </Text>
          <Text className="w-24 text-right text-xs font-bold" style={{ color: colors.primary }}>
            Est. Cost
          </Text>
        </View>

        {/* Table Rows */}
        {items.map((item, index) => (
          <View
            key={item.productId}
            className="flex-row items-center px-4 py-3"
            style={{
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
            }}>
            <Text className="w-10 text-sm font-semibold" style={{ color: colors.muted }}>
              {index + 1}
            </Text>
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                {item.productName}
              </Text>
              <Text className="text-xs" style={{ color: colors.muted }}>
                {item.orders.length} order{item.orders.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text className="w-20 text-right text-sm font-bold" style={{ color: colors.primary }}>
              {item.totalQuantity} {item.unit}
            </Text>
            <Text className="w-24 text-right text-sm" style={{ color: colors.text }}>
              {formatPrice(item.totalQuantity * item.avgBuyingPrice)}
            </Text>
          </View>
        ))}

        {/* Totals Row */}
        <View
          className="flex-row items-center px-4 py-3"
          style={{ backgroundColor: colors.primary + '10', borderTopColor: colors.border, borderTopWidth: 1 }}>
          <Text className="w-10 text-xs font-bold" style={{ color: colors.primary }} />
          <Text className="flex-1 text-sm font-bold" style={{ color: colors.text }}>
            Total
          </Text>
          <Text className="w-20 text-right text-sm font-bold" style={{ color: colors.primary }}>
            {items.reduce((sum, i) => sum + i.totalQuantity, 0)}
          </Text>
          <Text className="w-24 text-right text-sm font-bold" style={{ color: colors.primary }}>
            {formatPrice(items.reduce((sum, i) => sum + i.totalQuantity * i.avgBuyingPrice, 0))}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Collection Item Card
interface CollectionItemCardProps {
  item: CollectionItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
}

function CollectionItemCard({
  item,
  index,
  isExpanded,
  onToggle,
  colors,
}: CollectionItemCardProps) {
  const estimatedCost = item.totalQuantity * item.avgBuyingPrice;

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

          {/* Item Info */}
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {item.productName}
            </Text>
            <View className="mt-1 flex-row items-center gap-3">
              <Text className="text-sm" style={{ color: colors.muted }}>
                {item.orders.length} order{item.orders.length !== 1 ? 's' : ''}
              </Text>
              <Text className="text-sm" style={{ color: colors.muted }}>
                ~{formatPrice(item.avgBuyingPrice)}/{item.unit}
              </Text>
            </View>
          </View>

          {/* Quantity */}
          <View className="items-end">
            <View className="rounded-lg px-3 py-1.5" style={{ backgroundColor: colors.primary }}>
              <Text className="font-bold text-white">
                {item.totalQuantity} {item.unit}
              </Text>
            </View>
            <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
              ~{formatPrice(estimatedCost)}
            </Text>
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

      {/* Expanded Order Details */}
      {isExpanded && (
        <View className="border-t px-4 pb-4 pt-2" style={{ borderColor: colors.border }}>
          <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
            ORDER BREAKDOWN
          </Text>
          <View className="gap-2">
            {item.orders.map((order) => (
              <View
                key={order.orderId}
                className="flex-row items-center justify-between rounded-lg p-2"
                style={{ backgroundColor: colors.background }}>
                <View className="flex-1">
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>
                    {order.customerName}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {order.orderNumber}
                  </Text>
                </View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {order.quantity} {item.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
