// components/ui/DatePickerSheet.tsx
// The canonical date picker. On Android the native dialog handles its own
// dismissal; on iOS the spinner renders inside a BottomSheet with an explicit
// Done button — never inline in a screen, where the wheel has no way to close
// unless the user happens to change the value.
import React, { useEffect, useState } from 'react';
import { Platform, Text, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';
import { fonts } from 'constants/design';
import BottomSheet from './BottomSheet';

interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Currently selected date; falls back to today when null. */
  value: Date | null;
  onSelect: (date: Date) => void;
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePickerSheet({
  visible,
  onClose,
  value,
  onSelect,
  title = 'Pick a date',
  minimumDate,
  maximumDate,
}: DatePickerSheetProps) {
  const { colors } = useThemeContext();
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  useEffect(() => {
    if (visible) setDraft(value ?? new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={value ?? new Date()}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          onClose();
          if (event.type === 'set' && date) onSelect(date);
        }}
      />
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} maxHeightRatio={0.6}>
      <DateTimePicker
        value={draft}
        mode="date"
        display="spinner"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(_event: DateTimePickerEvent, date?: Date) => {
          if (date) setDraft(date);
        }}
        style={{ alignSelf: 'center' }}
      />
      <Pressable
        onPress={() => {
          onSelect(draft);
          onClose();
        }}
        style={{
          backgroundColor: colors.cta,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 8,
        }}>
        <Text style={{ color: colors.onCta, fontFamily: fonts.bold, fontSize: 15 }}>Done</Text>
      </Pressable>
    </BottomSheet>
  );
}
