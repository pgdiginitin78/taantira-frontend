import * as yup from "yup";

export const registerValidationSchema = yup.object({
  full_name: yup
    .string()
    .trim()
    .min(2, "Minimum 2 characters required")
    .max(120)
    .required("Full name is required"),
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("Enter a valid email address")
    .required("Email is required"),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{10,15}$/, "Enter a valid 10-digit mobile number")
    .required("Mobile number is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

export const loginValidationSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

export const profileValidationSchema = yup.object({
  full_name: yup
    .string()
    .trim()
    .min(2)
    .max(120)
    .required("Full name is required"),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number")
    .nullable(),
  date_of_birth: yup.string().nullable(),
  preferred_size: yup.string().nullable(),
  marketing_opt_in: yup.boolean().default(true),
});

export const addressValidationSchema = yup.object({
  label: yup.string().trim().required("Address label is required"),
  recipient_name: yup
    .string()
    .trim()
    .min(2)
    .required("Recipient name is required"),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{8,15}$/, "Valid phone number required")
    .required("Phone is required"),
  address_line1: yup
    .string()
    .trim()
    .min(5, "Enter complete street/building address")
    .required("Address line 1 is required"),
  address_line2: yup.string().trim().nullable(),
  landmark: yup.string().trim().nullable(),
  city: yup.string().trim().required("City is required"),
  state: yup.string().trim().required("State is required"),
  pincode: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, "Enter a valid 6-digit PIN code")
    .required("PIN code is required"),
  is_default: yup.boolean().default(false),
});

export const checkoutValidationSchema = yup.object({
  customer_name: yup.string().trim().min(2).required("Full name is required"),
  customer_email: yup
    .string()
    .trim()
    .email("Valid email required")
    .required("Email is required"),
  customer_phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{8,15}$/, "Valid phone required")
    .required("Phone is required"),
  recipient_name: yup
    .string()
    .trim()
    .min(2)
    .required("Recipient name is required"),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{8,15}$/, "Valid phone required")
    .required("Delivery phone is required"),
  address_line1: yup
    .string()
    .trim()
    .min(5)
    .required("Address line 1 is required"),
  address_line2: yup.string().trim().nullable(),
  landmark: yup.string().trim().nullable(),
  city: yup.string().trim().required("City is required"),
  state: yup.string().trim().required("State is required"),
  pincode: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, "Valid 6-digit PIN code required")
    .required("PIN code is required"),
  delivery_mode: yup
    .string()
    .oneOf(["own_partner", "third_party_courier"])
    .required("Select delivery method"),
  payment_method: yup
    .string()
    .oneOf(["cod", "manual_upi"])
    .required("Select payment method"),
  upi_utr: yup.string().trim().nullable(),
  notes: yup.string().max(500).nullable(),
});

export const couponApplyValidationSchema = yup.object({
  code: yup
    .string()
    .trim()
    .uppercase()
    .min(3, "Enter coupon code")
    .required("Coupon code is required"),
});

export const upiSubmitValidationSchema = yup.object({
  utr_number: yup
    .string()
    .trim()
    .min(6, "UTR must be at least 6 characters")
    .max(80)
    .required("UTR / Reference number is required"),
});

export const cancellationValidationSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .min(3, "Provide a cancellation reason")
    .required("Reason is required"),
  details: yup.string().max(600).nullable(),
});

export const returnRequestValidationSchema = yup.object({
  request_type: yup
    .string()
    .oneOf(["return", "exchange"])
    .required("Select request type"),
  reason: yup
    .string()
    .trim()
    .min(3, "Enter a reason")
    .required("Reason is required"),
  details: yup.string().max(800).nullable(),
});

export const reviewValidationSchema = yup.object({
  rating: yup.number().min(1).max(5).required("Rating is required"),
  title: yup.string().trim().max(150).nullable(),
  comment: yup
    .string()
    .trim()
    .min(5, "Review must be at least 5 characters")
    .required("Review is required"),
});

export const productValidationSchema = yup.object({
  name: yup.string().trim().min(3).required("Product name is required"),
  slug: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
    .required("Slug is required"),
  sku: yup.string().trim().min(3).required("SKU is required"),
  primary_category_id: yup
    .number()
    .typeError("Category is required")
    .positive()
    .required("Category is required"),
  base_price: yup
    .number()
    .typeError("Enter valid price")
    .positive("Must be positive")
    .required("Base price is required"),
  sale_price: yup
    .number()
    .transform((v, o) => (o === "" ? null : v))
    .positive()
    .nullable(),
  fabric: yup.string().trim().required("Fabric is required"),
  occasion: yup.string().trim().required("Occasion is required"),
  description: yup
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .required("Description is required"),
  image_url: yup.string().trim().nullable(),
  variant_sku: yup.string().trim().required("Initial variant SKU required"),
  variant_size: yup.string().trim().required("Initial size required"),
  variant_color_name: yup.string().trim().required("Color name required"),
  variant_color_hex: yup
    .string()
    .matches(/^#[0-9A-Fa-f]{6}$/, "Hex code e.g. #641B32")
    .required("Color hex required"),
  variant_stock_qty: yup
    .number()
    .typeError("Enter valid quantity")
    .integer()
    .min(0)
    .required("Stock qty required"),
});

export const variantValidationSchema = yup.object({
  sku: yup.string().trim().required("SKU is required"),
  size: yup.string().trim().required("Size is required"),
  color_name: yup.string().trim().required("Color name is required"),
  color_hex: yup
    .string()
    .matches(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required")
    .required("Color hex is required"),
  stock_qty: yup
    .number()
    .typeError("Enter valid stock")
    .integer()
    .min(0)
    .required("Stock is required"),
});

export const stockAdjustValidationSchema = yup.object({
  warehouse_id: yup
    .number()
    .typeError("Select warehouse")
    .required("Warehouse is required"),
  variant_id: yup
    .number()
    .typeError("Select product variant")
    .required("Variant is required"),
  movement_type: yup
    .string()
    .oneOf(["purchase", "adjustment", "return", "rto"])
    .required("Movement type is required"),
  quantity_delta: yup
    .number()
    .typeError("Enter numeric adjustment")
    .integer()
    .notOneOf([0], "Cannot be zero")
    .required("Quantity delta is required"),
  notes: yup.string().max(255).nullable(),
});

export const couponAdminValidationSchema = yup.object({
  code: yup
    .string()
    .trim()
    .uppercase()
    .min(3)
    .required("Coupon code is required"),
  description: yup.string().trim().required("Description is required"),
  discount_type: yup
    .string()
    .oneOf(["percentage", "fixed"])
    .required("Discount type required"),
  discount_value: yup
    .number()
    .typeError("Numeric value required")
    .positive()
    .required("Value is required"),
  min_purchase_amount: yup
    .number()
    .typeError("Numeric amount required")
    .min(0)
    .default(0),
  max_discount_amount: yup
    .number()
    .transform((v, o) => (o === "" ? null : v))
    .positive()
    .nullable(),
  starts_at: yup.string().required("Start date required"),
  expires_at: yup.string().required("Expiry date required"),
});

export const paymentVerifyValidationSchema = yup.object({
  decision: yup
    .string()
    .oneOf(["paid", "failed"])
    .required("Select verification decision"),
  verification_note: yup
    .string()
    .trim()
    .required("Verification note is required"),
  received_amount: yup
    .number()
    .typeError("Valid amount required")
    .min(0)
    .required("Received amount is required"),
});

export const refundAdminValidationSchema = yup.object({
  order_id: yup
    .number()
    .typeError("Select an order")
    .positive()
    .required("Order is required"),
  amount: yup
    .number()
    .typeError("Enter refund amount")
    .positive()
    .required("Amount is required"),
  refund_type: yup
    .string()
    .oneOf(["full", "partial"])
    .required("Type is required"),
  reason: yup.string().trim().min(3).required("Reason is required"),
  reference_number: yup
    .string()
    .trim()
    .required("Reference number is required"),
});

export const partnerRegisterValidationSchema = yup.object({
  full_name: yup.string().trim().min(2).required("Full name is required"),
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("Valid email required")
    .required("Email is required"),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{8,15}$/, "Valid phone required")
    .required("Phone is required"),
  password: yup
    .string()
    .min(8, "Minimum 8 characters")
    .required("Password is required"),
  address: yup.string().trim().min(5).required("Address is required"),
  city: yup.string().trim().required("City is required"),
  state: yup.string().trim().required("State is required"),
  pincode: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, "6-digit PIN required")
    .required("PIN code is required"),
  service_pincodes_csv: yup
    .string()
    .trim()
    .required("Enter at least one 6-digit service PIN code"),
  vehicle_type: yup.string().trim().required("Vehicle type is required"),
  vehicle_number: yup
    .string()
    .trim()
    .min(4)
    .required("Vehicle number is required"),
  doc_type: yup.string().trim().required("Document type is required"),
  doc_number_masked: yup
    .string()
    .trim()
    .min(4)
    .required("Masked document reference is required"),
});

export const partnerVerifyValidationSchema = yup.object({
  approval_status: yup
    .string()
    .oneOf(["approved", "rejected", "suspended"])
    .required("Status is required"),
  rejection_reason: yup.string().trim().nullable(),
});

export const otpCompleteValidationSchema = yup.object({
  otp: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, "Enter the 6-digit customer OTP")
    .required("Customer OTP is required"),
  recipient_name: yup.string().trim().nullable(),
  note: yup.string().trim().nullable(),
  cod_collected: yup.boolean().default(false),
});

export const courierBookValidationSchema = yup.object({
  order_id: yup
    .number()
    .typeError("Select an order")
    .positive()
    .required("Order is required"),
  courier_company: yup
    .string()
    .trim()
    .min(2)
    .required("Courier company is required"),
  awb_number: yup.string().trim().min(4).required("AWB number is required"),
  tracking_url: yup.string().url("Enter a valid URL").nullable(),
  pickup_date: yup.string().nullable(),
});

export const settingsValidationSchema = yup.object({
  store_name: yup.string().trim().required("Store name is required"),
  upi_vpa: yup.string().trim().required("Business UPI VPA is required"),
  upi_payee_name: yup.string().trim().required("Payee name is required"),
  free_shipping_threshold: yup
    .number()
    .typeError("Enter valid number")
    .min(0)
    .required("Required"),
  default_shipping_fee: yup
    .number()
    .typeError("Enter valid number")
    .min(0)
    .required("Required"),
  default_tax_rate: yup
    .number()
    .typeError("Enter valid number")
    .min(0)
    .max(28)
    .required("Required"),
});

export const supportTicketValidationSchema = yup.object({
  subject: yup.string().trim().min(4).required("Subject is required"),
  category: yup.string().trim().required("Category is required"),
  priority: yup
    .string()
    .oneOf(["low", "medium", "high"])
    .required("Priority is required"),
  message: yup.string().trim().min(5).required("Message is required"),
});
