import * as yup from 'yup';

export const categorySchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  buyingPrice: yup.string().required('Purchase price is required'),
  sellingPrice: yup.string().required('Selling price is required'),
  unit: yup.string().required('Unit is required'),
  isActive: yup.boolean().required('Status is required'),
});

// ==================== AUTH SCHEMAS ====================

export const loginSchema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  rememberMe: yup.boolean().default(false),
});

export const signupSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .required('Last name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// ==================== ONBOARDING SCHEMAS ====================

export const businessInfoSchema = yup.object().shape({
  businessName: yup
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .required('Business name is required'),
  businessType: yup.string().required('Please select a business type'),
  businessPhone: yup
    .string()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
      message: 'Please enter a valid phone number',
      excludeEmptyString: true,
    })
    .nullable(),
  businessEmail: yup.string().email('Please enter a valid email').nullable(),
  businessLicense: yup.string().max(50, 'License number must not exceed 50 characters').nullable(),
  website: yup.string().url('Please enter a valid URL').nullable(),
  description: yup.string().max(500, 'Description must not exceed 500 characters').nullable(),
});

export const businessAddressSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(['business', 'billing', 'delivery'], 'Invalid address type')
    .default('business'),
  street: yup
    .string()
    .min(5, 'Street address must be at least 5 characters')
    .max(200, 'Street address must not exceed 200 characters')
    .required('Street address is required'),
  city: yup
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters')
    .required('City is required'),
  state: yup.string().max(100, 'State must not exceed 100 characters').nullable(),
  postalCode: yup
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code must not exceed 20 characters')
    .required('Postal code is required'),
  country: yup.string().max(100, 'Country must not exceed 100 characters').default('UK'),
  isPrimary: yup.boolean().default(true),
});

// ==================== TYPE EXPORTS ====================

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type SignupFormData = yup.InferType<typeof signupSchema>;
export type BusinessInfoFormData = yup.InferType<typeof businessInfoSchema>;
export type BusinessAddressFormData = yup.InferType<typeof businessAddressSchema>;
export type CategoryFormData = yup.InferType<typeof categorySchema>;
