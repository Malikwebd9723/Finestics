// screens/Vendor/components/FormInputFields.tsx
import React from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';

// ==================== FORM INPUT ====================
interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export function FormInput({
  label,
  error,
  required = false,
  containerClassName = '',
  ...textInputProps
}: FormInputProps) {
  const { colors } = useThemeContext();

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <TextInput
        className="rounded-xl px-4 py-3.5"
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          fontSize: 15,
        }}
        placeholderTextColor={colors.muted}
        {...textInputProps}
      />
      {error && (
        <Text className="mt-1.5 text-xs" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ==================== FORM TEXT AREA ====================
interface FormTextAreaProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
  minHeight?: number;
}

export function FormTextArea({
  label,
  error,
  required = false,
  containerClassName = '',
  minHeight = 80,
  ...textInputProps
}: FormTextAreaProps) {
  const { colors } = useThemeContext();

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <TextInput
        className="rounded-xl px-4 py-3"
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          minHeight,
          textAlignVertical: 'top',
          fontSize: 15,
        }}
        placeholderTextColor={colors.muted}
        multiline
        {...textInputProps}
      />
      {error && (
        <Text className="mt-1.5 text-xs" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ==================== FORM SELECT ====================
interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
}

export function FormSelect({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  containerClassName = '',
}: FormSelectProps) {
  const { colors } = useThemeContext();

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              disabled={disabled}
              className="rounded-xl px-4 py-2.5"
              style={{
                backgroundColor: isSelected ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
                opacity: disabled ? 0.5 : 1,
              }}>
              <Text
                className="text-sm font-medium"
                style={{ color: isSelected ? '#fff' : colors.text }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && (
        <Text className="mt-1.5 text-xs" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ==================== FORM ROW ====================
interface FormRowProps {
  children: React.ReactNode;
  gap?: number;
}

export function FormRow({ children, gap = 3 }: FormRowProps) {
  return (
    <View className="flex-row" style={{ gap: gap * 4 }}>
      {children}
    </View>
  );
}

// ==================== FORM SECTION ====================
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  const { colors } = useThemeContext();

  return (
    <View className="mt-5">
      <View className="mb-4 flex-row items-center">
        <View className="mr-2 h-5 w-1 rounded-full" style={{ backgroundColor: colors.primary }} />
        <Text className="text-base font-bold" style={{ color: colors.text }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
