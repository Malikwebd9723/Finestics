import * as yup from 'yup';

export const categorySchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  buyingPrice: yup.string().required('Purchase price is required'),
  sellingPrice: yup.string().required('Selling price is required'),
  unit: yup.string().required('Unit is required'),
  isActive: yup.boolean().required('Status is required'),
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

export const businessInfoSchema = yup.object().shape({
  businessName: yup.string().required('Business name is required'),
  businessType: yup.string().required('Business type is required'),
  businessLicense: yup.string().optional(),
  website: yup.string().url('Enter a valid URL').nullable(),
  description: yup.string().required('Description is required'),
  businessPhone: yup.string().optional(),
  businessEmail: yup.string().email('Invalid email').optional(),
  preferredDeliveryTime: yup.string().optional(),
  specialInstructions: yup.string().optional(),
});

export const businessAddressSchema = yup.object().shape({
  type: yup.string().required('Address type is required'),
  label: yup.string().required('Address label is required'),
  street: yup.string().required('Street is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  postalCode: yup.string().required('Postal code is required'),
  country: yup.string().required('Country name is required'),
  isPrimary: yup.boolean(),
});


// Customer Validation Schema with Address
export const customerSchema = yup.object().shape({
  businessName: yup
    .string()
    .required("Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must not exceed 100 characters"),
  contactPerson: yup
    .string()
    .required("Contact person is required")
    .min(2, "Contact person name must be at least 2 characters")
    .max(100, "Contact person name must not exceed 100 characters"),
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9]{10,15}$/, "Phone must be 10-15 digits without spaces or special characters"),
  alternatePhone: yup
    .string()
    .notRequired()
    .test("is-valid-phone", "Alternate phone must be 10-15 digits", function(value) {
      if (!value) return true;
      return /^[0-9]{10,15}$/.test(value);
    }),
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format")
    .lowercase(),
  creditLimit: yup
    .string()
    .notRequired()
    .test("is-valid-number", "Credit limit must be a valid number", function(value) {
      if (!value) return true;
      return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
    }),
  paymentTerms: yup
    .string()
    .required("Payment terms are required")
    .oneOf(
      ["cash", "net_7", "net_15", "net_30", "net_60", "net_90"],
      "Invalid payment terms"
    ),
  businessType: yup
    .string()
    .required("Business type is required")
    .oneOf(
      ["restaurant", "retailer", "wholesaler", "hotel", "cafe", "other"],
      "Invalid business type"
    ),
  notes: yup
    .string()
    .notRequired()
    .max(500, "Notes must not exceed 500 characters"),
  deliveryInstructions: yup
    .string()
    .notRequired()
    .max(500, "Delivery instructions must not exceed 500 characters"),
  
  // Address fields
  type: yup
    .string()
    .required("Address type is required")
    .oneOf(["business", "residential", "warehouse"], "Invalid address type"),
  label: yup
    .string()
    .required("Address label is required")
    .min(2, "Address label must be at least 2 characters")
    .max(50, "Address label must not exceed 50 characters"),
  street: yup
    .string()
    .required("Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(200, "Street address must not exceed 200 characters"),
  city: yup
    .string()
    .required("City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters"),
  state: yup
    .string()
    .required("State/Province is required")
    .min(2, "State must be at least 2 characters")
    .max(50, "State must not exceed 50 characters"),
  postalCode: yup
    .string()
    .required("Postal code is required")
    .matches(/^[0-9]{4,6}$/, "Postal code must be 4-6 digits"),
  country: yup
    .string()
    .required("Country is required")
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must not exceed 50 characters"),
  instructions: yup
    .string()
    .notRequired()
    .max(200, "Address instructions must not exceed 200 characters"),
});