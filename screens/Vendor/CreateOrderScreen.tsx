// screens/Vendor/CreateOrderScreen.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import Toast from 'utils/Toast';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';
import {
  createOrder,
  updateOrder,
  fetchOrderDetails,
  addOrderItem,
  addMultipleOrderItems,
  removeOrderItem,
  updateOrderItem,
} from 'api/actions/orderActions';
import { fetchVans } from 'api/actions/vendorActions';
import { checkPendingItems } from 'api/actions/returnActions';
import CustomerSelectModal from './components/CustomerSelectModal';
import ProductSelectModal from './components/ProductSelectModal';
import {
  CartItem,
  CreateOrderPayload,
  UpdateOrderPayload,
  PAYMENT_METHODS,
  PaymentMethod,
  calculateCartTotal,
  formatPrice,
} from 'types/order.types';
import { Customer } from 'types/customer.types';
import { Product } from 'types/product.types';

// Extended CartItem for edit mode
interface ExtendedCartItem extends CartItem {
  itemId?: number;
  isOriginal?: boolean;
}

export default function CreateOrderScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const orderId = route.params?.orderId || null;
  const isEditMode = !!orderId;

  // State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(new Date());
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [vanName, setVanName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('cash');

  // Date picker states
  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);

  // Modal states
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [vanModalVisible, setVanModalVisible] = useState(false);

  // Pending items
  const [includePendingItems, setIncludePendingItems] = useState(false);

  // Fetch vans
  const { data: vansData } = useQuery({
    queryKey: ['vans'],
    queryFn: fetchVans,
  });

  const vans: string[] = vansData?.data || [];

  // Check for pending items when customer is selected (create mode only)
  const { data: pendingCheck } = useQuery({
    queryKey: ['pendingItemsCheck', selectedCustomer?.id],
    queryFn: () => checkPendingItems(selectedCustomer!.id),
    enabled: !!selectedCustomer?.id && !isEditMode,
  });
  const hasPendingItems = pendingCheck?.data?.hasPendingItems;
  const pendingItemsCount = pendingCheck?.data?.count || 0;

  // Fetch order for editing
  const { data: orderData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => fetchOrderDetails(orderId),
    enabled: isEditMode,
  });

  // Load order data when editing
  useEffect(() => {
    if (orderData?.data) {
      const order = orderData.data;

      if (order.customer) {
        setSelectedCustomer(order.customer as Customer);
      }

      if (order.orderDate) {
        setOrderDate(new Date(order.orderDate));
      }
      if (order.deliveryDate) {
        setDeliveryDate(new Date(order.deliveryDate));
      }
      setDeliveryFee(order.deliveryFee?.toString() || '0');
      setDiscount(order.discount?.toString() || '0');
      setNotes(order.notes || '');
      setVanName(order.vanName || '');
      setPaymentMethod(order.paymentMethod || 'cash');

      if (order.items) {
        setOriginalItems(order.items);
        const cartItems: ExtendedCartItem[] = order.items.map((item: any) => ({
          productId: item.productId,
          itemId: item.id,
          name: item.productName,
          unit: item.unit,
          buyingPrice: parseFloat(item.buyingPrice as string),
          sellingPrice: parseFloat(item.sellingPrice as string),
          quantity: parseFloat(item.orderedQuantity as string),
          notes: item.notes || undefined,
          isOriginal: true,
        }));
        setCart(cartItems);
      }
    }
  }, [orderData]);

  // Calculations
  const { subtotal, total } = useMemo(() => {
    return calculateCartTotal(cart, parseFloat(deliveryFee) || 0, parseFloat(discount) || 0);
  }, [cart, deliveryFee, discount]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItemsCheck'] });
      Toast.success('Order created successfully!');
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.error(error?.message || 'Failed to create order');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateOrderPayload) => updateOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      Toast.success('Order updated successfully!');
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.error(error?.message || 'Failed to update order');
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (data: { productId: number; orderedQuantity: number; sellingPrice?: number }) =>
      addOrderItem(orderId, data),
  });

  const addMultipleItemsMutation = useMutation({
    mutationFn: (items: { productId: number; orderedQuantity: number; sellingPrice?: number }[]) =>
      addMultipleOrderItems(orderId, items),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => removeOrderItem(orderId, itemId),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) =>
      updateOrderItem(orderId, itemId, data),
  });

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    addItemMutation.isPending ||
    addMultipleItemsMutation.isPending ||
    removeItemMutation.isPending ||
    updateItemMutation.isPending;

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          buyingPrice: parseFloat(product.buyingPrice as string) || 0,
          sellingPrice: parseFloat(product.sellingPrice as string) || 0,
          quantity: 1,
          isOriginal: false,
        },
      ];
    });
  };

  const removeFromCart = (productId: number) => {
    const item = cart.find((i) => i.productId === productId);

    if (isEditMode && item?.isOriginal && item?.itemId) {
      Alert.alert('Remove Item', 'This will permanently remove this item from the order.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeItemMutation.mutate(item.itemId!, {
              onSuccess: () => {
                setCart((prev) => prev.filter((i) => i.productId !== productId));
                Toast.success('Item removed');
              },
              onError: (error: any) => {
                Toast.error(error?.message || 'Failed to remove item');
              },
            });
          },
        },
      ]);
    } else {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const updateItemPrice = (productId: number, price: string) => {
    const priceNum = parseFloat(price) || 0;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, sellingPrice: priceNum } : item
      )
    );
  };

  // Date handlers
  const handleOrderDateChange = (event: any, selectedDate?: Date) => {
    setShowOrderDatePicker(false);
    if (selectedDate) setOrderDate(selectedDate);
  };

  const handleDeliveryDateChange = (event: any, selectedDate?: Date) => {
    setShowDeliveryDatePicker(false);
    if (selectedDate) setDeliveryDate(selectedDate);
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert('Validation Error', 'Please select a customer');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item');
      return;
    }

    // Validate all items have valid quantities and prices
    const invalidItem = cart.find((item) => !item.quantity || item.quantity <= 0 || isNaN(item.sellingPrice));
    if (invalidItem) {
      Alert.alert('Validation Error', `"${invalidItem.name}" has an invalid quantity or price`);
      return;
    }

    if (isEditMode) {
      try {
        const newItems = cart.filter((item) => !item.isOriginal);
        const modifiedItems = cart.filter((item) => {
          if (!item.isOriginal) return false;
          const original = originalItems.find((o) => o.id === item.itemId);
          if (!original) return false;
          return (
            parseFloat(original.orderedQuantity) !== item.quantity ||
            parseFloat(original.sellingPrice) !== item.sellingPrice
          );
        });

        if (newItems.length > 0) {
          const itemsToAdd = newItems.map((item) => ({
            productId: item.productId,
            orderedQuantity: item.quantity,
            sellingPrice: item.sellingPrice,
          }));
          if (itemsToAdd.length === 1) {
            await addItemMutation.mutateAsync(itemsToAdd[0]);
          } else {
            await addMultipleItemsMutation.mutateAsync(itemsToAdd);
          }
        }

        for (const item of modifiedItems) {
          await updateItemMutation.mutateAsync({
            itemId: item.itemId!,
            data: { orderedQuantity: item.quantity, sellingPrice: item.sellingPrice },
          });
        }

        const payload: UpdateOrderPayload = {
          orderDate: orderDate.toISOString(),
          deliveryDate: deliveryDate ? deliveryDate.toISOString() : undefined,
          deliveryFee: parseFloat(deliveryFee) || 0,
          discount: parseFloat(discount) || 0,
          notes: notes || undefined,
          vanName: vanName || undefined,
        };
        updateMutation.mutate(payload);
      } catch (error: any) {
        Toast.error(error?.message || 'Failed to update order');
      }
    } else {
      const payload: CreateOrderPayload = {
        customerId: selectedCustomer.id,
        orderDate: orderDate.toISOString(),
        deliveryDate: deliveryDate ? deliveryDate.toISOString() : undefined,
        deliveryFee: parseFloat(deliveryFee) || 0,
        discount: parseFloat(discount) || 0,
        paymentMethod: paymentMethod,
        notes: notes || undefined,
        vanName: vanName || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          orderedQuantity: item.quantity,
          sellingPrice: item.sellingPrice,
          notes: item.notes,
        })),
        ...(includePendingItems && { includePendingItems: true }),
      };
      createMutation.mutate(payload);
    }
  };

  if (isEditMode && isLoadingOrder) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.muted }}>
          Loading order...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Header */}
        <View
          className="flex-row items-center border-b px-4 py-3"
          style={{ borderColor: colors.border }}>
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {isEditMode ? 'Edit Order' : 'New Order'}
          </Text>
        </View>

        <FlatList
          data={cart}
          keyExtractor={(item) => item.productId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View className="px-4 pt-4">
              {/* Customer Selection */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                  Customer <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setCustomerModalVisible(true)}
                  disabled={isSubmitting || isEditMode}
                  className="flex-row items-center justify-between rounded-xl p-4"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: selectedCustomer ? colors.primary : colors.border,
                    opacity: isEditMode ? 0.7 : 1,
                  }}>
                  {selectedCustomer ? (
                    <View className="flex-1">
                      <Text className="font-semibold" style={{ color: colors.text }}>
                        {selectedCustomer.businessName}
                      </Text>
                      <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                        {selectedCustomer.contactPerson} • {selectedCustomer.phone}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: colors.placeholder }}>Select Customer</Text>
                  )}
                  {!isEditMode && (
                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Pending Items Banner */}
              {hasPendingItems && !isEditMode && (
                <View
                  className="mb-4 rounded-xl p-3"
                  style={{ backgroundColor: '#3b82f620', borderWidth: 1, borderColor: '#3b82f6' }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <MaterialIcons name="info" size={20} color="#3b82f6" />
                      <Text className="ml-2 flex-1 text-sm" style={{ color: colors.text }}>
                        {pendingItemsCount} pending replacement item(s)
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setIncludePendingItems(!includePendingItems)}>
                      <MaterialIcons
                        name={includePendingItems ? 'check-box' : 'check-box-outline-blank'}
                        size={24}
                        color="#3b82f6"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text className="mt-1 ml-7 text-xs" style={{ color: colors.muted }}>
                    Include free replacement items in this order
                  </Text>
                </View>
              )}

              {/* Add Items Button - ALWAYS VISIBLE */}
              <TouchableOpacity
                onPress={() => setProductModalVisible(true)}
                disabled={isSubmitting}
                className="mb-4 flex-row items-center justify-center rounded-xl p-4"
                style={{ backgroundColor: colors.primary, opacity: isSubmitting ? 0.5 : 1 }}>
                <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
                <Text className="ml-2 font-bold text-white">
                  {isEditMode ? 'Add More Items' : 'Add Items to Cart'}
                </Text>
              </TouchableOpacity>

              {/* Cart Header */}
              {cart.length > 0 && (
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    Cart Items ({cart.length})
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                    Subtotal: {formatPrice(subtotal)}
                  </Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center px-4 py-16">
              <MaterialIcons name="shopping-cart" size={64} color={colors.muted} />
              <Text className="mt-4 text-center text-base" style={{ color: colors.text }}>
                No items in cart
              </Text>
              <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
                Tap "Add Items to Cart" to get started
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <CartItemCard
              item={item}
              colors={colors}
              disabled={isSubmitting}
              isEditMode={isEditMode}
              onRemove={() => removeFromCart(item.productId)}
              onUpdateQuantity={(qty) => updateQuantity(item.productId, qty)}
              onUpdatePrice={(price) => updateItemPrice(item.productId, price)}
            />
          )}
          ListFooterComponent={
            cart.length > 0 ? (
              <View className="mt-4 px-4">
                {/* Order Details */}
                <View className="mb-4">
                  {/* Dates */}
                  <View className="mb-3 flex-row gap-3">
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                        Order Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowOrderDatePicker(true)}
                        disabled={isSubmitting}
                        className="flex-row items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}>
                        <Text className="text-sm" style={{ color: colors.text }}>
                          {orderDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                        Delivery Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDeliveryDatePicker(true)}
                        disabled={isSubmitting}
                        className="flex-row items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}>
                        <Text
                          className="text-sm"
                          style={{ color: deliveryDate ? colors.text : colors.placeholder }}>
                          {deliveryDate
                            ? deliveryDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                            : 'Not set'}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Van Selection */}
                  <View className="mb-3">
                    <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                      Delivery Van
                    </Text>
                    <TouchableOpacity
                      onPress={() => setVanModalVisible(true)}
                      disabled={isSubmitting}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: vanName ? colors.primary : colors.border,
                      }}>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="car-outline"
                          size={18}
                          color={vanName ? colors.primary : colors.muted}
                        />
                        <Text
                          className="ml-2"
                          style={{ color: vanName ? colors.text : colors.placeholder }}>
                          {vanName || 'Select Van'}
                        </Text>
                      </View>
                      <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
                    </TouchableOpacity>
                  </View>

                  {/* Fees */}
                  <View className="mb-3 flex-row gap-3">
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                        Delivery Fee
                      </Text>
                      <TextInput
                        value={deliveryFee}
                        onChangeText={setDeliveryFee}
                        keyboardType="decimal-pad"
                        editable={!isSubmitting}
                        className="rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                        placeholder="0"
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                        Discount
                      </Text>
                      <TextInput
                        value={discount}
                        onChangeText={setDiscount}
                        keyboardType="decimal-pad"
                        editable={!isSubmitting}
                        className="rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: colors.card,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                        placeholder="0"
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>
                  </View>

                  {/* Payment Method (Create only) */}
                  {!isEditMode && (
                    <View className="mb-3">
                      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                        Payment Method
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}>
                        {PAYMENT_METHODS.map((method) => (
                          <TouchableOpacity
                            key={method.value}
                            onPress={() => setPaymentMethod(method.value)}
                            disabled={isSubmitting}
                            className="rounded-lg px-4 py-2.5"
                            style={{
                              backgroundColor:
                                paymentMethod === method.value ? colors.primary : colors.card,
                              borderWidth: 1,
                              borderColor:
                                paymentMethod === method.value ? colors.primary : colors.border,
                            }}>
                            <Text
                              className="text-sm font-medium"
                              style={{
                                color: paymentMethod === method.value ? '#fff' : colors.text,
                              }}>
                              {method.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Notes */}
                  <View>
                    <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                      Notes (Optional)
                    </Text>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={2}
                      editable={!isSubmitting}
                      className="rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                      placeholder="Order notes..."
                      placeholderTextColor={colors.placeholder}
                    />
                  </View>
                </View>

                {/* Order Summary */}
                <View
                  className="mb-4 rounded-xl p-4"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                    ORDER SUMMARY
                  </Text>
                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text style={{ color: colors.muted }}>Subtotal ({cart.length} items)</Text>
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {formatPrice(subtotal)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text style={{ color: colors.muted }}>Delivery Fee</Text>
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {formatPrice(parseFloat(deliveryFee) || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text style={{ color: colors.muted }}>Discount</Text>
                      <Text className="font-medium" style={{ color: '#ef4444' }}>
                        -{formatPrice(parseFloat(discount) || 0)}
                      </Text>
                    </View>
                    <View
                      className="mt-2 flex-row justify-between border-t pt-3"
                      style={{ borderColor: colors.border }}>
                      <Text className="text-base font-bold" style={{ color: colors.text }}>
                        Total
                      </Text>
                      <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                        {formatPrice(total)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="mb-4 flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    disabled={isSubmitting}
                    className="flex-1 items-center rounded-xl py-3.5"
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: isSubmitting ? 0.5 : 1,
                    }}>
                    <Text className="font-semibold" style={{ color: colors.text }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
                    style={{ backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons
                          name={isEditMode ? 'check' : 'send'}
                          size={18}
                          color="#fff"
                        />
                        <Text className="ml-1 font-bold text-white">
                          {isEditMode ? 'Update' : 'Create Order'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {showOrderDatePicker && (
        <DateTimePicker
          value={orderDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleOrderDateChange}
          maximumDate={new Date()}
        />
      )}
      {showDeliveryDatePicker && (
        <DateTimePicker
          value={deliveryDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDeliveryDateChange}
          minimumDate={orderDate}
        />
      )}

      {/* Modals */}
      <CustomerSelectModal
        visible={customerModalVisible}
        selectedCustomerId={selectedCustomer?.id || null}
        onSelect={(customer: Customer) => {
          setSelectedCustomer(customer);
          setIncludePendingItems(false);
        }}
        onClose={() => setCustomerModalVisible(false)}
      />
      <ProductSelectModal
        visible={productModalVisible}
        cart={cart}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onClose={() => setProductModalVisible(false)}
      />
      <VanSelectModal
        visible={vanModalVisible}
        vans={vans}
        selectedVan={vanName}
        onSelect={(van) => {
          setVanName(van);
          setVanModalVisible(false);
        }}
        onClose={() => setVanModalVisible(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// Cart Item Card
interface CartItemCardProps {
  item: ExtendedCartItem;
  colors: any;
  disabled: boolean;
  isEditMode: boolean;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
  onUpdatePrice: (price: string) => void;
}

function CartItemCard({
  item,
  colors,
  disabled,
  isEditMode,
  onRemove,
  onUpdateQuantity,
  onUpdatePrice,
}: CartItemCardProps) {
  const [qtyText, setQtyText] = useState(item.quantity.toString());
  const [priceText, setPriceText] = useState(item.sellingPrice.toString());
  const itemTotal = item.sellingPrice * item.quantity;

  // Sync local text when item values change from outside (e.g. +/- buttons)
  useEffect(() => {
    setQtyText(item.quantity.toString());
  }, [item.quantity]);
  useEffect(() => {
    setPriceText(item.sellingPrice.toString());
  }, [item.sellingPrice]);

  const handleQtyBlur = () => {
    const val = parseFloat(qtyText);
    if (!isNaN(val) && val > 0) {
      onUpdateQuantity(val);
    } else {
      setQtyText(item.quantity.toString());
    }
  };

  const handlePriceBlur = () => {
    const val = parseFloat(priceText);
    if (!isNaN(val) && val >= 0) {
      onUpdatePrice(val.toString());
    } else {
      setPriceText(item.sellingPrice.toString());
    }
  };

  return (
    <View
      className="mx-4 mb-3 rounded-xl p-4"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: item.isOriginal ? colors.border : colors.primary,
      }}>
      <View className="mb-3 flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {item.name}
            </Text>
            {!item.isOriginal && isEditMode && (
              <View
                className="ml-2 rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.primary + '20' }}>
                <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                  NEW
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
            {item.unit}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} disabled={disabled} className="p-1">
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="mr-2 text-xs" style={{ color: colors.muted }}>
            Price:
          </Text>
          <TextInput
            value={priceText}
            onChangeText={setPriceText}
            onBlur={handlePriceBlur}
            keyboardType="decimal-pad"
            editable={!disabled}
            className="w-20 rounded-lg px-3 py-1.5"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              textAlign: 'center',
            }}
          />
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => onUpdateQuantity(Math.max(0, item.quantity - 1))}
            disabled={disabled}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.background }}>
            <Ionicons name="remove" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            value={qtyText}
            onChangeText={setQtyText}
            onBlur={handleQtyBlur}
            keyboardType="decimal-pad"
            editable={!disabled}
            className="mx-2 w-16 rounded-lg py-1.5"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              textAlign: 'center',
              fontWeight: '600',
            }}
          />
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            disabled={disabled}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary }}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View
        className="mt-3 flex-row items-center justify-between border-t pt-3"
        style={{ borderColor: colors.border }}>
        <Text className="text-sm" style={{ color: colors.muted }}>
          {formatPrice(item.sellingPrice)} × {item.quantity} {item.unit}
        </Text>
        <Text className="text-base font-bold" style={{ color: colors.primary }}>
          {formatPrice(itemTotal)}
        </Text>
      </View>
    </View>
  );
}

// Van Select Modal
function VanSelectModal({ visible, vans, selectedVan, onSelect, onClose, colors }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="mx-6 w-full max-w-sm rounded-2xl p-4"
          style={{ backgroundColor: colors.card }}>
          <Text className="mb-4 text-lg font-bold" style={{ color: colors.text }}>
            Select Van
          </Text>
          {vans.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="car-outline" size={40} color={colors.muted} />
              <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
                No vans available.{'\n'}Add vans in your profile settings.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              <TouchableOpacity
                onPress={() => onSelect('')}
                className="flex-row items-center rounded-lg p-3"
                style={{
                  backgroundColor: !selectedVan ? colors.primary + '20' : colors.background,
                  borderWidth: 1,
                  borderColor: !selectedVan ? colors.primary : colors.border,
                }}>
                <Ionicons
                  name={!selectedVan ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={!selectedVan ? colors.primary : colors.muted}
                />
                <Text
                  className="ml-3 font-medium"
                  style={{ color: !selectedVan ? colors.primary : colors.text }}>
                  No Van Assigned
                </Text>
              </TouchableOpacity>
              {vans.map((van: string) => (
                <TouchableOpacity
                  key={van}
                  onPress={() => onSelect(van)}
                  className="flex-row items-center rounded-lg p-3"
                  style={{
                    backgroundColor:
                      selectedVan === van ? colors.primary + '20' : colors.background,
                    borderWidth: 1,
                    borderColor: selectedVan === van ? colors.primary : colors.border,
                  }}>
                  <Ionicons
                    name={selectedVan === van ? 'checkmark-circle' : 'car-outline'}
                    size={20}
                    color={selectedVan === van ? colors.primary : colors.muted}
                  />
                  <Text
                    className="ml-3 font-medium"
                    style={{ color: selectedVan === van ? colors.primary : colors.text }}>
                    {van}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            onPress={onClose}
            className="mt-4 items-center rounded-lg py-3"
            style={{
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text className="font-semibold" style={{ color: colors.text }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
