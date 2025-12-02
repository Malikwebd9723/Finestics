import { ToastAndroid } from "react-native";

export const ERROR_MESSAGES = [
    {
        code: "VENDOR_PENDING_APPROVAL",
        message: "Profile approval pending.",
    },
    {
        code: "INVALID_AUTH_HEADER",
        message: "Invalid User",
    },
    {
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid.",
    },
    {
        code: "USER_NOT_FOUND",
        message: "User does not exist.",
    },
    {
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email already exists.",
    },
    {
        code: "VALIDATION_FAILED",
        message: "Invalid input data.",
    }
];

interface ResponseProp {
    error: {
        code: string;
    }
}
export function errorHandler(data: ResponseProp) {
    const code = data.error.code;
    if (!code) {
        return {
            code: "UNKNOWN_ERROR",
            message: "Something went wrong.",
        };
    }

    // Find matching error object
    const matched = ERROR_MESSAGES.find(item => item.code === code);
    ToastAndroid.show(matched ? matched.message : "Something went wrong.", ToastAndroid.SHORT);
    // Default fallback
    return {
        code,
        message: "Unexpected error occurred.",
    };
}
