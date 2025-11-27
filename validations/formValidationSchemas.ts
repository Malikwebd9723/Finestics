import * as yup from 'yup';

export const categorySchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  purchase: yup.string().required('Purchase price is required'),
  selling: yup.string().required('Selling price is required'),
  unit: yup.string().required('Unit is required'),
  status: yup.string().required('Status is required'),
});

export const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  rememberMe: yup.boolean(),
});

export const signupSchema = yup.object().shape({
  firstName: yup.string().min(2, 'Too short').required('First name required'),
  lastName: yup.string().min(2, 'Too short').required('Last name required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().optional(),
  password: yup.string().min(6, 'Min 6 chars').required('Password required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
});

export const businessSchema = yup.object().shape({
  businessName: yup.string().required('Business name is required'),
  businessType: yup.string().required('Business type is required'),
  licenseNumber: yup.string().required('License number is required'),
  website: yup.string().url('Enter a valid URL').nullable(),
  description: yup.string().required('Description is required'),
});
