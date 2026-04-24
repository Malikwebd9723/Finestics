import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'allTime'
  | 'custom';

export interface DateRange {
  from: string;
  to: string;
  preset: DatePreset;
}

interface DatePresetSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  availablePresets?: DatePreset[];
}

const DEFAULT_PRESETS: DatePreset[] = [
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisWeek',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
  'allTime',
  'custom',
];

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  thisWeek: 'This week',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  thisQuarter: 'This quarter',
  thisYear: 'This year',
  allTime: 'All time',
  custom: 'Custom…',
};

const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfDay = (d: Date): Date => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const rangeForPreset = (preset: DatePreset): { from: string; to: string } => {
  const today = startOfDay(new Date());
  const y = today.getFullYear();
  const m = today.getMonth();
  const toStr = toDateString(today);

  switch (preset) {
    case 'today':
      return { from: toStr, to: toStr };
    case 'yesterday': {
      const y1 = new Date(today);
      y1.setDate(today.getDate() - 1);
      const s = toDateString(y1);
      return { from: s, to: s };
    }
    case 'last7': {
      const s = new Date(today);
      s.setDate(today.getDate() - 6);
      return { from: toDateString(s), to: toStr };
    }
    case 'last30': {
      const s = new Date(today);
      s.setDate(today.getDate() - 29);
      return { from: toDateString(s), to: toStr };
    }
    case 'thisWeek': {
      const day = today.getDay();
      const offset = (day + 6) % 7; // days since Monday
      const s = new Date(today);
      s.setDate(today.getDate() - offset);
      return { from: toDateString(s), to: toStr };
    }
    case 'thisMonth':
      return { from: toDateString(new Date(y, m, 1)), to: toStr };
    case 'lastMonth': {
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 0);
      return { from: toDateString(s), to: toDateString(e) };
    }
    case 'thisQuarter': {
      const qStart = Math.floor(m / 3) * 3;
      return { from: toDateString(new Date(y, qStart, 1)), to: toStr };
    }
    case 'thisYear':
      return { from: toDateString(new Date(y, 0, 1)), to: toStr };
    case 'allTime':
      return { from: '2000-01-01', to: toStr };
    case 'custom':
    default:
      return { from: toStr, to: toStr };
  }
};

export const defaultRange = (preset: DatePreset = 'today'): DateRange => {
  const r = rangeForPreset(preset);
  return { ...r, preset };
};

const formatDisplay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function DatePresetSelector({
  value,
  onChange,
  availablePresets = DEFAULT_PRESETS,
}: DatePresetSelectorProps) {
  const { colors } = useThemeContext();
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [pickerField, setPickerField] = useState<'from' | 'to' | null>(null);
  const [draftRange, setDraftRange] = useState({ from: value.from, to: value.to });

  const summaryLabel = useMemo(() => {
    const label = PRESET_LABELS[value.preset] || 'Custom';
    if (value.preset === 'today' || value.preset === 'yesterday') return label;
    return `${formatDisplay(value.from)} — ${formatDisplay(value.to)}`;
  }, [value]);

  const handlePresetTap = (preset: DatePreset) => {
    if (preset === 'custom') {
      setDraftRange({ from: value.from, to: value.to });
      setCustomModalVisible(true);
      return;
    }
    const r = rangeForPreset(preset);
    onChange({ ...r, preset });
  };

  const handleDatePicked = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setPickerField(null);
    if (!selectedDate) return;

    const dateStr = toDateString(selectedDate);
    setDraftRange((prev) => {
      if (pickerField === 'from') {
        return { from: dateStr, to: prev.to < dateStr ? dateStr : prev.to };
      }
      if (pickerField === 'to') {
        return { from: prev.from > dateStr ? dateStr : prev.from, to: dateStr };
      }
      return prev;
    });
    if (Platform.OS === 'ios') setPickerField(null);
  };

  const applyCustom = () => {
    onChange({ ...draftRange, preset: 'custom' });
    setCustomModalVisible(false);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {availablePresets.map((preset) => {
          const active = value.preset === preset;
          return (
            <TouchableOpacity
              key={preset}
              onPress={() => handlePresetTap(preset)}
              className="items-center justify-center rounded-full px-4"
              style={{
                height: 34,
                backgroundColor: active ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
              }}>
              <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.text }}>
                {PRESET_LABELS[preset]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="px-4 pt-1.5">
        <Text className="text-[11px]" style={{ color: colors.muted }}>
          {summaryLabel}
        </Text>
      </View>

      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-11/12 rounded-2xl p-5" style={{ backgroundColor: colors.card }}>
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Custom range
            </Text>

            <View className="mb-3 flex-row gap-2">
              <TouchableOpacity
                onPress={() => setPickerField('from')}
                className="flex-1 rounded-lg px-3 py-3"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-[10px]" style={{ color: colors.muted }}>
                  FROM
                </Text>
                <View className="mt-0.5 flex-row items-center">
                  <MaterialIcons name="calendar-today" size={14} color={colors.primary} />
                  <Text className="ml-2 text-sm" style={{ color: colors.text }}>
                    {formatDisplay(draftRange.from)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPickerField('to')}
                className="flex-1 rounded-lg px-3 py-3"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-[10px]" style={{ color: colors.muted }}>
                  TO
                </Text>
                <View className="mt-0.5 flex-row items-center">
                  <MaterialIcons name="calendar-today" size={14} color={colors.primary} />
                  <Text className="ml-2 text-sm" style={{ color: colors.text }}>
                    {formatDisplay(draftRange.to)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {pickerField && (
              <DateTimePicker
                value={new Date((pickerField === 'from' ? draftRange.from : draftRange.to) + 'T12:00:00')}
                mode="date"
                display="default"
                onChange={handleDatePicked}
                maximumDate={new Date()}
              />
            )}

            <View className="mt-3 flex-row justify-end gap-3">
              <TouchableOpacity onPress={() => setCustomModalVisible(false)} className="rounded-lg px-4 py-2">
                <Text style={{ color: colors.muted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyCustom}
                className="rounded-lg px-4 py-2"
                style={{ backgroundColor: colors.primary }}>
                <Text className="font-semibold text-white">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
