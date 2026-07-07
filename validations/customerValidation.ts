// validations/customerValidation.ts
import * as yup from 'yup';

export const customerSchema = yup.object({
  // Required — a quick add only needs these two
  businessName: yup
    .string()
    .required('Business name is required')
    .trim()
    .max(200, 'Business name must be less than 200 characters'),
  phone: yup
    .string()
    .required('Phone is required')
    .trim()
    .max(20, 'Phone must be less than 20 characters'),

  // Contact details (optional)
  contactPerson: yup.string().trim().max(100, 'Contact person must be less than 100 characters'),
  alternatePhone: yup.string().trim().max(20, 'Alternate phone must be less than 20 characters'),
  email: yup.string().email('Invalid email format').trim(),
  businessType: yup.string().default('other'),

  // Payment information (optional)
  creditLimit: yup.string().test('is-valid-number', 'Must be a valid number', (value) => {
    if (!value) return true;
    return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
  }),
  paymentTerms: yup.string().default('cash'),

  // Address (optional — walk-in customers may have none),
  // but street and city must be filled together
  street: yup
    .string()
    .trim()
    .max(500, 'Street must be less than 500 characters')
    .test('street-with-city', 'Street is required when city is filled', function (value) {
      const { city } = this.parent;
      return !(city && !value);
    }),
  city: yup
    .string()
    .trim()
    .max(100, 'City must be less than 100 characters')
    .test('city-with-street', 'City is required when street is filled', function (value) {
      const { street } = this.parent;
      return !(street && !value);
    }),
  postalCode: yup.string().trim().max(20, 'Postal code must be less than 20 characters'),

  // Additional information
  notes: yup.string().trim(),
  deliveryInstructions: yup.string().trim().max(500, 'Instructions must be less than 500 characters'),
});

export type CustomerFormSchema = yup.InferType<typeof customerSchema>;
