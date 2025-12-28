// components/common/FormInput.tsx
import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { useThemeContext } from "context/ThemeProvider";

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
    containerClassName = "",
    ...textInputProps
}: FormInputProps) {
    const { colors } = useThemeContext();

    return (
        <View className={containerClassName}>
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                {label} {required && <Text style={{ color: "#ef4444" }}>*</Text>}
            </Text>
            <TextInput
                className="rounded-xl p-4 mb-2"
                style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: error ? "#ef4444" : colors.muted,
                }}
                placeholderTextColor={colors.placeholder}
                {...textInputProps}
            />
            {error && (
                <Text className="text-xs mb-2" style={{ color: "#ef4444" }}>
                    {error}
                </Text>
            )}
        </View>
    );
}

// components/common/FormTextArea.tsx
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
    containerClassName = "",
    minHeight = 80,
    ...textInputProps
}: FormTextAreaProps) {
    const { colors } = useThemeContext();

    return (
        <View className={containerClassName}>
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                {label} {required && <Text style={{ color: "#ef4444" }}>*</Text>}
            </Text>
            <TextInput
                className="rounded-xl p-4 mb-2"
                style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: error ? "#ef4444" : colors.muted,
                    minHeight,
                    textAlignVertical: "top",
                }}
                placeholderTextColor={colors.placeholder}
                multiline
                {...textInputProps}
            />
            {error && (
                <Text className="text-xs mb-2" style={{ color: "#ef4444" }}>
                    {error}
                </Text>
            )}
        </View>
    );
}

// components/common/FormSelect.tsx
import { TouchableOpacity } from "react-native";

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
    containerClassName = "",
}: FormSelectProps) {
    const { colors } = useThemeContext();

    return (
        <View className={containerClassName}>
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                {label} {required && <Text style={{ color: "#ef4444" }}>*</Text>}
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        disabled={disabled}
                        className="px-4 py-2 rounded-xl"
                        style={{
                            backgroundColor: value === option.value ? colors.primary : colors.background,
                            borderWidth: 1,
                            borderColor: value === option.value ? colors.primary : colors.muted,
                            opacity: disabled ? 0.5 : 1,
                        }}
                    >
                        <Text
                            className="text-sm font-semibold"
                            style={{ color: value === option.value ? "#fff" : colors.text }}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {error && (
                <Text className="text-xs mb-2" style={{ color: "#ef4444" }}>
                    {error}
                </Text>
            )}
        </View>
    );
}

// components/common/FormRow.tsx
interface FormRowProps {
    children: React.ReactNode;
    gap?: number;
}

export function FormRow({ children, gap = 3 }: FormRowProps) {
    return <View className={`flex-row gap-${gap} mb-4`}>{children}</View>;
}

// components/common/FormSection.tsx
interface FormSectionProps {
    title: string;
    children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
    const { colors } = useThemeContext();

    return (
        <View>
            <Text className="text-base font-bold mb-3 mt-4" style={{ color: colors.primary }}>
                {title}
            </Text>
            {children}
        </View>
    );
}