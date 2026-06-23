import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';
import { radius } from 'constants/design';
import { DateRange, DatePreset, rangeForPreset } from './DatePresetSelector';

const MAIN: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'thisWeek', label: 'Week' },
  { key: 'thisMonth', label: 'Month' },
];

const MORE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'thisQuarter', label: 'This quarter' },
  { key: 'thisYear', label: 'This year' },
  { key: 'allTime', label: 'All time' },
];

// Short label for the "More" segment when a non-main preset is active.
const COMPACT: Partial<Record<DatePreset, string>> = {
  yesterday: 'Yest.',
  last7: '7 days',
  last30: '30 days',
  lastMonth: 'Last mo',
  thisQuarter: 'Quarter',
  thisYear: 'Year',
  allTime: 'All time',
  custom: 'Custom',
};

const toDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fmt = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

/**
 * Professional segmented date control — fixed Today / Week / Month that fill the
 * width (no horizontal scrolling), plus a "More" sheet for the full preset list
 * and a custom range.
 */
export default function SegmentedDateFilter({ value, onChange }: Props) {
  const { colors } = useThemeContext();
  const [sheet, setSheet] = useState(false);
  const [pickerField, setPickerField] = useState<'from' | 'to' | null>(null);
  const [draft, setDraft] = useState({ from: value.from, to: value.to });

  const moreActive = !MAIN.some((s) => s.key === value.preset);
  const moreLabel = moreActive ? (COMPACT[value.preset] ?? 'More') : 'More';

  const selectPreset = (key: DatePreset) => {
    onChange({ ...rangeForPreset(key), preset: key });
    setSheet(false);
  };

  const onPick = (_e: any, d?: Date) => {
    if (Platform.OS === 'android') setPickerField(null);
    if (!d) return;
    const ds = toDateString(d);
    setDraft((prev) =>
      pickerField === 'from'
        ? { from: ds, to: prev.to < ds ? ds : prev.to }
        : { from: prev.from > ds ? ds : prev.from, to: ds }
    );
    if (Platform.OS === 'ios') setPickerField(null);
  };

  const applyCustom = () => {
    onChange({ ...draft, preset: 'custom' });
    setSheet(false);
  };

  const segStyle = (active: boolean) => ({
    height: 36,
    borderRadius: radius.chip,
    backgroundColor: active ? colors.card : 'transparent',
    borderWidth: active ? 1 : 0,
    borderColor: colors.border,
  });

  return (
    <View className="px-4">
      <View
        className="flex-row p-1"
        style={{ backgroundColor: colors.gray, borderRadius: radius.chip + 4 }}>
        {MAIN.map((s) => {
          const active = value.preset === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              activeOpacity={0.85}
              onPress={() => selectPreset(s.key)}
              className="flex-1 items-center justify-center"
              style={segStyle(active)}>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: active ? colors.text : colors.muted }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setDraft({ from: value.from, to: value.to });
            setSheet(true);
          }}
          className="flex-1 flex-row items-center justify-center"
          style={segStyle(moreActive)}>
          <Text
            className="text-[13px] font-semibold"
            style={{ color: moreActive ? colors.text : colors.muted }}>
            {moreLabel}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color={moreActive ? colors.text : colors.muted}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={sheet}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSheet(false)}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity activeOpacity={1} className="p-5" style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Select range
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {MORE_PRESETS.map((p) => {
                const active = value.preset === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => selectPreset(p.key)}
                    className="rounded-full px-4 py-2"
                    style={{
                      backgroundColor: active ? colors.primary : colors.background,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                    }}>
                    <Text
                      className="text-[13px] font-medium"
                      style={{ color: active ? '#FFFFFF' : colors.text }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="mb-2 mt-5 text-base font-semibold" style={{ color: colors.text }}>
              Custom range
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setPickerField('from')}
                className="flex-1 rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-[10px]" style={{ color: colors.muted }}>
                  FROM
                </Text>
                <Text className="mt-0.5 text-sm" style={{ color: colors.text }}>
                  {fmt(draft.from)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPickerField('to')}
                className="flex-1 rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-[10px]" style={{ color: colors.muted }}>
                  TO
                </Text>
                <Text className="mt-0.5 text-sm" style={{ color: colors.text }}>
                  {fmt(draft.to)}
                </Text>
              </TouchableOpacity>
            </View>
            {pickerField && (
              <DateTimePicker
                value={new Date((pickerField === 'from' ? draft.from : draft.to) + 'T12:00:00')}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onPick}
              />
            )}

            <View className="mt-4 flex-row justify-end gap-3">
              <TouchableOpacity onPress={() => setSheet(false)} className="rounded-xl px-4 py-2.5">
                <Text style={{ color: colors.muted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyCustom}
                className="rounded-xl px-5 py-2.5"
                style={{ backgroundColor: colors.primary }}>
                <Text className="font-semibold text-white">Apply custom</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
