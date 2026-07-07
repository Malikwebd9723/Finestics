// screens/Vendor/components/ApproveConnectionModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { formatPrice } from 'utils/currency';
import type {
  ConnectionRequest,
  ApproveConnectionPayload,
} from 'api/actions/connectionActions';

interface Props {
  visible: boolean;
  request: ConnectionRequest | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: ApproveConnectionPayload) => void;
}

const PAYMENT_TERMS = ['Cash', '7 days credit', '15 days credit', '30 days credit'];

export default function ApproveConnectionModal({
  visible,
  request,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const { colors } = useThemeContext();

  const customerName = request?.customerUser
    ? `${request.customerUser.firstName} ${request.customerUser.lastName}`.trim()
    : '';

  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Cash');
  const [businessType, setBusinessType] = useState('');
  const [notes, setNotes] = useState('');

  // Prefill from the request whenever it changes (matched records carry the
  // vendor's previously-set credit terms).
  useEffect(() => {
    if (request) {
      setBusinessName(request.businessName || customerName || '');
      setContactPerson(request.contactPerson || customerName || '');
      setCreditLimit(
        request.creditLimit && Number(request.creditLimit) > 0
          ? String(Number(request.creditLimit))
          : ''
      );
      setPaymentTerms('Cash');
      setBusinessType('');
      setNotes('');
    }
  }, [request]);

  const inputStyle = {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
    marginTop: 14,
  };

  const handleSubmit = () => {
    onSubmit({
      businessName: businessName.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      creditLimit: creditLimit ? Number(creditLimit) : 0,
      paymentTerms: paymentTerms || undefined,
      businessType: businessType.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              Approve Connection
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            {/* Identity caution: request matched a pre-existing customer record by
                unverified phone/email — approving grants that record's credit. */}
            {request?.matchedExistingRecord && (
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.gray,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 4,
                }}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.error}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                    Matched to your existing customer record
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                    This signup used the phone/email on a record you created
                    {request?.creditLimit != null
                      ? ` (credit limit ${formatPrice(request.creditLimit)}, balance ${formatPrice(request.currentBalance)})`
                      : ''}
                    . Contact details are not verified — confirm this is really your customer
                    before approving.
                  </Text>
                </View>
              </View>
            )}
            {!!customerName && (
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 4,
                }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Requesting customer</Text>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 2 }}>
                  {customerName}
                </Text>
                {!!request?.customerUser?.email && (
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                    {request.customerUser.email}
                  </Text>
                )}
                {!!request?.customerUser?.phone && (
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {request.customerUser.phone}
                  </Text>
                )}
              </View>
            )}

            <Text style={labelStyle}>Business Name</Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Customer's business name"
              placeholderTextColor={colors.placeholder}
              style={inputStyle}
            />

            <Text style={labelStyle}>Contact Person</Text>
            <TextInput
              value={contactPerson}
              onChangeText={setContactPerson}
              placeholder="Primary contact"
              placeholderTextColor={colors.placeholder}
              style={inputStyle}
            />

            <Text style={labelStyle}>Credit Limit</Text>
            <TextInput
              value={creditLimit}
              onChangeText={setCreditLimit}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              style={inputStyle}
            />
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
              0 means cash only — credit orders will be blocked for this customer.
            </Text>

            <Text style={labelStyle}>Payment Terms</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
              {PAYMENT_TERMS.map((term) => {
                const selected = paymentTerms === term;
                return (
                  <Pressable
                    key={term}
                    onPress={() => setPaymentTerms(term)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: selected ? colors.cta : colors.background,
                      borderWidth: 1,
                      borderColor: selected ? colors.cta : colors.border,
                    }}>
                    <Text style={{ color: selected ? colors.onCta : colors.text, fontSize: 13 }}>
                      {term}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={labelStyle}>Business Type</Text>
            <TextInput
              value={businessType}
              onChangeText={setBusinessType}
              placeholder="e.g. restaurant, cafe, shop"
              placeholderTextColor={colors.placeholder}
              style={inputStyle}
            />

            <Text style={labelStyle}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Internal notes about this customer"
              placeholderTextColor={colors.placeholder}
              multiline
              style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
            />

            <Pressable
              disabled={submitting}
              onPress={handleSubmit}
              style={{
                backgroundColor: colors.cta,
                borderRadius: 12,
                paddingVertical: 15,
                alignItems: 'center',
                marginTop: 22,
                opacity: submitting ? 0.7 : 1,
              }}>
              {submitting ? (
                <ActivityIndicator color={colors.onCta} />
              ) : (
                <Text style={{ color: colors.onCta, fontWeight: '700', fontSize: 16 }}>
                  Approve & Set Terms
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
