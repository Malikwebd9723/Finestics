// validations/productValidation.ts
import * as yup from 'yup';

export const productSchema = yup.object({
  name: yup
    .string()
    .required('Product name is required')
    .trim()
    .max(150, 'Name must be less than 150 characters'),
  unit: yup.string().required('Unit is required').trim(),
  buyingPrice: yup.string().test('is-valid-number', 'Must be a valid number', (value) => {
    if (!value) return true;
    return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
  }),
  sellingPrice: yup.string().test('is-valid-number', 'Must be a valid number', (value) => {
    if (!value) return true;
    return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
  }),
  description: yup.string().trim(),
  isActive: yup.boolean().default(true),
});

export type ProductFormSchema = yup.InferType<typeof productSchema>;
