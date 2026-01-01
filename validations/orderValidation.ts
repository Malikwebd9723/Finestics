// validations/orderValidation.ts
import * as yup from 'yup';

export const createOrderSchema = yup.object({
  customerId: yup.number().required('Please select a customer').positive('Invalid customer'),
  deliveryDate: yup.string().nullable(),
  deliveryFee: yup.number().min(0, 'Delivery fee cannot be negative').default(0),
  discount: yup.number().min(0, 'Discount cannot be negative').default(0),
  paymentMethod: yup
    .string()
    .oneOf(['cash', 'bank_transfer', 'upi', 'cheque', 'credit', null, ''])
    .nullable(),
  notes: yup.string().trim().nullable(),
  deliveryAddress: yup.string().trim().nullable(),
  vanName: yup.string().trim().nullable(),
  items: yup
    .array()
    .of(
      yup.object({
        productId: yup.number().required().positive(),
        orderedQuantity: yup.number().required().positive('Quantity must be positive'),
        sellingPrice: yup.number().min(0).optional(),
        notes: yup.string().trim().nullable(),
      })
    )
    .min(1, 'Please add at least one item'),
});

export const updateOrderSchema = yup.object({
  deliveryDate: yup.string().nullable(),
  deliveryFee: yup.number().min(0, 'Delivery fee cannot be negative'),
  discount: yup.number().min(0, 'Discount cannot be negative'),
  notes: yup.string().trim().nullable(),
  deliveryAddress: yup.string().trim().nullable(),
  vanName: yup.string().trim().nullable(),
  allowCompletedEdit: yup.boolean(), // NEW: flag to allow editing completed orders
});

// UPDATED: Allow negative amounts for refunds/adjustments
export const recordPaymentSchema = yup.object({
  amount: yup
    .number()
    .required('Amount is required')
    .test('non-zero', 'Amount cannot be zero', (value) => value !== 0),
  paymentMethod: yup
    .string()
    .oneOf(['cash', 'bank_transfer', 'upi', 'cheque', null, ''])
    .nullable(),
  isAdjustment: yup.boolean().default(false), // NEW: flag for refunds/adjustments
  notes: yup.string().trim().nullable(), // NEW: payment notes
});

export const cartItemSchema = yup.object({
  productId: yup.number().required(),
  name: yup.string().required(),
  unit: yup.string().required(),
  buyingPrice: yup.number().required(),
  sellingPrice: yup.number().required().min(0),
  quantity: yup.number().required().positive('Quantity must be positive'),
  notes: yup.string().nullable(),
});

// NEW: Bulk cancel schema
export const bulkCancelSchema = yup.object({
  orderIds: yup
    .array()
    .of(yup.number().required().positive())
    .min(1, 'Select at least one order')
    .required(),
  reason: yup.string().trim().nullable(),
});

// NEW: Bulk status update schema
export const bulkStatusSchema = yup.object({
  orderIds: yup
    .array()
    .of(yup.number().required().positive())
    .min(1, 'Select at least one order')
    .required(),
  status: yup
    .string()
    .oneOf(['pending', 'confirmed', 'collected', 'delivered', 'completed', 'cancelled'])
    .required('Status is required'),
});

// NEW: Bulk van assignment schema
export const bulkAssignVanSchema = yup.object({
  orderIds: yup
    .array()
    .of(yup.number().required().positive())
    .min(1, 'Select at least one order')
    .required(),
  vanName: yup.string().trim().required('Van name is required'),
});

export type CreateOrderSchema = yup.InferType<typeof createOrderSchema>;
export type UpdateOrderSchema = yup.InferType<typeof updateOrderSchema>;
export type RecordPaymentSchema = yup.InferType<typeof recordPaymentSchema>;
export type BulkCancelSchema = yup.InferType<typeof bulkCancelSchema>;
export type BulkStatusSchema = yup.InferType<typeof bulkStatusSchema>;
export type BulkAssignVanSchema = yup.InferType<typeof bulkAssignVanSchema>;
