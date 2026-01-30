// validations/expenseValidation.ts

import * as yup from 'yup';

export const expenseSchema = yup.object({
  category: yup
    .string()
    .required('Category is required')
    .trim()
    .max(100, 'Category must be less than 100 characters'),

  amount: yup
    .string()
    .required('Amount is required')
    .test('is-valid-number', 'Must be a valid number', (value) => {
      if (!value) return false;
      return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
    })
    .test('is-positive', 'Amount must be greater than 0', (value) => {
      if (!value) return false;
      return parseFloat(value) > 0;
    }),

  description: yup
    .string()
    .trim()
    .max(500, 'Description must be less than 500 characters'),

  date: yup.date().required('Date is required'),

  notes: yup
    .string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters'),
});

export type ExpenseFormData = yup.InferType<typeof expenseSchema>;
