// validations/returnValidation.ts
import * as yup from 'yup';

export const processReturnSchema = yup.object({
  items: yup
    .array()
    .of(
      yup.object({
        orderItemId: yup.number().required().positive(),
        quantity: yup.number().required().positive('Quantity must be positive'),
        reason: yup.string().trim().nullable(),
        action: yup
          .string()
          .oneOf(['credit', 'refund', 'replace_next_order'])
          .default('credit'),
      })
    )
    .min(1, 'Select at least one item to return'),
  returnDate: yup.string().nullable(),
  notes: yup.string().trim().nullable(),
});

export const cancelPendingItemSchema = yup.object({
  reason: yup.string().trim().nullable(),
});

export type ProcessReturnSchema = yup.InferType<typeof processReturnSchema>;
export type CancelPendingItemSchema = yup.InferType<typeof cancelPendingItemSchema>;
