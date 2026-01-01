// validations/customerValidation.ts
import * as yup from 'yup';

export const customerSchema = yup.object({
  // Business Information
  businessName: yup
    .string()
    .required('Business name is required')
    .trim()
    .max(200, 'Business name must be less than 200 characters'),
  contactPerson: yup
    .string()
    .required('Contact person is required')
    .trim()
    .max(100, 'Contact person must be less than 100 characters'),
  phone: yup
    .string()
    .required('Phone is required')
    .trim()
    .max(20, 'Phone must be less than 20 characters'),
  alternatePhone: yup.string().trim().max(20, 'Alternate phone must be less than 20 characters'),
  email: yup.string().email('Invalid email format').trim(),
  businessType: yup.string().required('Business type is required'),

  // Payment Information
  creditLimit: yup.string().test('is-valid-number', 'Must be a valid number', (value) => {
    if (!value) return true;
    return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
  }),
  paymentTerms: yup.string().required('Payment terms is required'),

  // Address Information
  type: yup
    .string()
    .required('Address type is required')
    .oneOf(['business', 'billing', 'delivery'], 'Invalid address type'),
  label: yup.string().trim().max(100, 'Label must be less than 100 characters'),
  street: yup
    .string()
    .required('Street is required')
    .trim()
    .max(500, 'Street must be less than 500 characters'),
  city: yup
    .string()
    .required('City is required')
    .trim()
    .max(100, 'City must be less than 100 characters'),
  state: yup.string().trim().max(100, 'State must be less than 100 characters'),
  postalCode: yup.string().trim().max(20, 'Postal code must be less than 20 characters'),
  country: yup.string().trim().max(100, 'Country must be less than 100 characters'),
  instructions: yup.string().trim().max(500, 'Instructions must be less than 500 characters'),

  // Additional Information
  notes: yup.string().trim(),
  deliveryInstructions: yup.string().trim(),
});

export type CustomerFormSchema = yup.InferType<typeof customerSchema>;
