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
});

export const recordPaymentSchema = yup.object({
  amount: yup.number().required('Amount is required').positive('Amount must be positive'),
  paymentMethod: yup
    .string()
    .oneOf(['cash', 'bank_transfer', 'upi', 'cheque', null, ''])
    .nullable(),
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

export type CreateOrderSchema = yup.InferType<typeof createOrderSchema>;
export type UpdateOrderSchema = yup.InferType<typeof updateOrderSchema>;
export type RecordPaymentSchema = yup.InferType<typeof recordPaymentSchema>;
