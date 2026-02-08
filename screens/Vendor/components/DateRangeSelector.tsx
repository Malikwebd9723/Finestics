// screens/Vendor/components/DateRangeSelector.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayString = () => toLocalDateString(new Date());

const isToday = (start: string, end: string) => {
  const today = getTodayString();
  return start === today && end === today;
};

const formatDisplay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function DateRangeSelector({
  startDate,
  endDate,
  onDateChange,
}: DateRangeSelectorProps) {
  const { colors } = useThemeContext();
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const todayActive = isToday(startDate, endDate);

  const handleTodayPress = () => {
    const today = getTodayString();
    onDateChange(today, today);
    setShowPicker(null);
  };

  const handleDatePicked = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    if (!selectedDate) return;

    const dateStr = toLocalDateString(selectedDate);

    if (showPicker === 'start') {
      onDateChange(dateStr, endDate < dateStr ? dateStr : endDate);
      if (Platform.OS === 'android') {
        setTimeout(() => setShowPicker('end'), 300);
      }
    } else if (showPicker === 'end') {
      onDateChange(startDate > dateStr ? dateStr : startDate, dateStr);
    }
    if (Platform.OS === 'ios') {
      setShowPicker(null);
    }
  };

  return (
    <View className="px-4 py-2">
      <View className="flex-row items-center gap-2">
        {/* Today chip */}
        <TouchableOpacity
          onPress={handleTodayPress}
          className="items-center justify-center rounded-full px-4"
          style={{
            height: 34,
            backgroundColor: todayActive ? colors.primary : colors.card,
            borderWidth: 1,
            borderColor: todayActive ? colors.primary : colors.border,
          }}>
          <Text
            className="text-xs font-semibold"
            style={{ color: todayActive ? '#fff' : colors.text }}>
            Today
          </Text>
        </TouchableOpacity>

        {/* Date range display */}
        <TouchableOpacity
          onPress={() => setShowPicker('start')}
          className="flex-row items-center rounded-full px-3"
          style={{
            height: 34,
            backgroundColor: !todayActive ? colors.primary + '10' : colors.card,
            borderWidth: 1,
            borderColor: !todayActive ? colors.primary + '40' : colors.border,
          }}>
          <MaterialIcons name="calendar-today" size={13} color={!todayActive ? colors.primary : colors.muted} />
          <Text
            className="ml-1.5 text-xs font-medium"
            style={{ color: !todayActive ? colors.primary : colors.text }}>
            {formatDisplay(startDate)}
          </Text>
        </TouchableOpacity>

        <Text className="text-xs" style={{ color: colors.muted }}>—</Text>

        <TouchableOpacity
          onPress={() => setShowPicker('end')}
          className="flex-row items-center rounded-full px-3"
          style={{
            height: 34,
            backgroundColor: !todayActive ? colors.primary + '10' : colors.card,
            borderWidth: 1,
            borderColor: !todayActive ? colors.primary + '40' : colors.border,
          }}>
          <MaterialIcons name="calendar-today" size={13} color={!todayActive ? colors.primary : colors.muted} />
          <Text
            className="ml-1.5 text-xs font-medium"
            style={{ color: !todayActive ? colors.primary : colors.text }}>
            {formatDisplay(endDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date(
            (showPicker === 'start' ? startDate : endDate) + 'T12:00:00'
          )}
          mode="date"
          display="default"
          onChange={handleDatePicked}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}
