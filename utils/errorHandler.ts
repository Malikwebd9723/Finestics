import { ToastAndroid } from 'react-native';

export const ERROR_MESSAGES = [
  {
    code: 'VENDOR_PENDING_APPROVAL',
    message: 'Profile approval pending.',
  },
  {
    code: 'ACCESS_TOKEN_EXPIRED',
    message: 'Login again to continue.',
  },
  {
    code: 'VALIDATION_FAILED',
    message: 'Wrong input data.',
  },
  {
    code: 'USER_NOT_FOUND',
    message: 'User does not exist.',
  },
  {
    code: 'EMAIL_ALREADY_EXISTS',
    message: 'Email already exists.',
  },
  {
    code: 'ACCOUNT_INACTIVE',
    message: 'Account suspended temporarily.',
  },
];

interface ResponseProp {
  error: {
    code: string;
  };
}
export function errorHandler(data: ResponseProp) {
  const code = data.error.code;
  if (!code) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong.',
    };
  }

  // Find matching error object
  const matched = ERROR_MESSAGES.find((item) => item.code === code);
  ToastAndroid.show(matched ? matched.message : 'Something went wrong.', ToastAndroid.SHORT);
  // Default fallback
  return {
    code,
    message: 'Unexpected error occurred.',
  };
}
