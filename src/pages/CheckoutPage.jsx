import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from "@mui/material";
import { CheckCircle2, MapPin, ShieldCheck, Truck, Wallet } from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { checkoutValidationSchema } from "../validations/schemas";
import { formatINR } from "../utils/formatters";

const CHECKOUT_STEPS = [
  "Customer Details",
  "Delivery Address",
  "PIN Check",
  "Delivery Method",
  "Payment Method",
  "Order Review",
  "Confirmation",
];

export default function CheckoutPage() {
  const user = useAuthStore((s) => s.user);
  const { items, summary, fetchCart, clearLocalCart } = useCartStore();
  const [activeStep, setActiveStep] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeErr, setPincodeErr] = useState("");
  const [checkoutConfig, setCheckoutConfig] = useState({
    upi_vpa: "taantira.atelier@upi",
    upi_payee_name: "Taantira Handloom & Couture Atelier",
  });
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [submitErr, setSubmitErr] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(checkoutValidationSchema),
    defaultValues: {
      customer_name: user?.full_name || "",
      customer_email: user?.email || "",
      customer_phone: user?.phone || "",
      recipient_name: user?.full_name || "",
      phone: user?.phone || "",
      address_line1: "",
      address_line2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      delivery_mode: "own_partner",
      payment_method: "manual_upi",
      upi_utr: "",
      notes: "",
    },
  });

  const watchedValues = useWatch({ control });
  const watchedPincode = watchedValues.pincode || "";
  const watchedPaymentMethod = watchedValues.payment_method || "manual_upi";
  const watchedDeliveryMode = watchedValues.delivery_mode || "own_partner";

  const applySavedAddress = useCallback(
    (addr) => {
      setValue("recipient_name", addr.recipient_name, { shouldValidate: true });
      setValue("phone", addr.phone, { shouldValidate: true });
      setValue("address_line1", addr.address_line1, { shouldValidate: true });
      setValue("address_line2", addr.address_line2 || "");
      setValue("landmark", addr.landmark || "");
      setValue("city", addr.city, { shouldValidate: true });
      setValue("state", addr.state, { shouldValidate: true });
      setValue("pincode", addr.pincode, { shouldValidate: true });
    },
    [setValue],
  );

  useEffect(() => {
    fetchCart();
    api
      .get("/checkout/config")
      .then((res) => setCheckoutConfig(res.data?.data || {}))
      .catch(() => {});
    api
      .get("/users/addresses")
      .then((res) => {
        const list = res.data?.data || [];
        setSavedAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def) applySavedAddress(def);
      })
      .catch(() => {});
  }, [fetchCart, applySavedAddress]);

  const checkPincode = async () => {
    setPincodeErr("");
    setPincodeResult(null);
    const valid = await trigger("pincode");
    if (!valid) return false;
    try {
      const res = await api.get(`/checkout/pincode/${watchedPincode}`);
      setPincodeResult(res.data.data);
      fetchCart(watchedPincode);
      return true;
    } catch (err) {
      setPincodeErr(err.response?.data?.message || "Unable to verify PIN code");
      return false;
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const ok = await trigger([
        "customer_name",
        "customer_email",
        "customer_phone",
      ]);
      if (!ok) return;
    } else if (activeStep === 1) {
      const ok = await trigger([
        "recipient_name",
        "phone",
        "address_line1",
        "city",
        "state",
        "pincode",
      ]);
      if (!ok) return;
    } else if (activeStep === 2) {
      const ok = await checkPincode();
      if (!ok) return;
    } else if (activeStep === 3) {
      const ok = await trigger("delivery_mode");
      if (!ok) return;
    } else if (activeStep === 4) {
      const ok = await trigger("payment_method");
      if (!ok) return;
    }
    setActiveStep((s) => Math.min(5, s + 1));
  };

  const onPlaceOrder = async (values) => {
    setSubmitErr("");
    try {
      const payload = {
        customer_name: values.customer_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone,
        shipping_address: {
          recipient_name: values.recipient_name,
          phone: values.phone,
          address_line1: values.address_line1,
          address_line2: values.address_line2 || null,
          landmark: values.landmark || null,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          country: "India",
        },
        delivery_mode: values.delivery_mode,
        payment_method: values.payment_method,
        upi_utr:
          values.payment_method === "manual_upi"
            ? values.upi_utr || null
            : null,
        coupon_code: summary.coupon?.code || null,
        notes: values.notes || null,
      };
      const res = await api.post("/checkout", payload);
      setOrderConfirmation(res.data.data);
      clearLocalCart();
      setActiveStep(6);
    } catch (err) {
      setSubmitErr(err.response?.data?.message || "Unable to place order.");
    }
  };

  if (items.length === 0 && activeStep < 6) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#3D1023]">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-[#641B32]/80">
          Your shopping bag is empty.
        </p>
        <Link
          to="/collections/all"
          className="mt-6 inline-block rounded-full bg-[#641B32] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2]"
        >
          Browse Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-[#3D1023]">
        Taantira Secure Checkout
      </h1>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        className="overflow-x-auto pb-2"
      >
        {CHECKOUT_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-3xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm lg:col-span-8">
          <form onSubmit={handleSubmit(onPlaceOrder)} className="flex flex-col gap-6">
            {/* Step 1: Customer Details */}
            {activeStep === 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-[#3D1023]">
                  1. Customer Details
                </h2>
                <Controller
                  name="customer_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Full Name"
                      fullWidth
                      error={Boolean(errors.customer_name)}
                      helperText={errors.customer_name?.message}
                    />
                  )}
                />
                <Controller
                  name="customer_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email Address"
                      fullWidth
                      error={Boolean(errors.customer_email)}
                      helperText={errors.customer_email?.message}
                    />
                  )}
                />
                <Controller
                  name="customer_phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone Number"
                      fullWidth
                      error={Boolean(errors.customer_phone)}
                      helperText={errors.customer_phone?.message}
                    />
                  )}
                />
              </div>
            )}

            {/* Step 2: Delivery Address */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#3D1023]">
                  <MapPin className="h-5 w-5 text-[#641B32]" /> 2. Delivery
                  Address
                </h2>
                {savedAddresses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => applySavedAddress(addr)}
                        className="cursor-pointer rounded-xl border border-[#D9A0A9] bg-[#FFF9F2] px-3 py-2 text-left text-xs hover:bg-[#F5E7E8]"
                      >
                        <p className="font-bold text-[#641B32]">
                          {addr.label} ({addr.pincode})
                        </p>
                        <p>
                          {addr.address_line1}, {addr.city}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="recipient_name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Recipient Name"
                        fullWidth
                        error={Boolean(errors.recipient_name)}
                        helperText={errors.recipient_name?.message}
                      />
                    )}
                  />
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Recipient Phone"
                        fullWidth
                        error={Boolean(errors.phone)}
                        helperText={errors.phone?.message}
                      />
                    )}
                  />
                </div>
                <Controller
                  name="address_line1"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Address Line 1"
                      fullWidth
                      error={Boolean(errors.address_line1)}
                      helperText={errors.address_line1?.message}
                    />
                  )}
                />
                <Controller
                  name="address_line2"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Apartment / Area (Optional)"
                      fullWidth
                    />
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="City"
                        fullWidth
                        error={Boolean(errors.city)}
                        helperText={errors.city?.message}
                      />
                    )}
                  />
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="State"
                        fullWidth
                        error={Boolean(errors.state)}
                        helperText={errors.state?.message}
                      />
                    )}
                  />
                  <Controller
                    name="pincode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="6-Digit PIN Code"
                        fullWidth
                        error={Boolean(errors.pincode)}
                        helperText={errors.pincode?.message}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: PIN-Code Check */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#3D1023]">
                  3. PIN-Code Serviceability Check
                </h2>
                <div className="flex gap-3">
                  <Controller
                    name="pincode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Delivery PIN Code"
                        error={Boolean(errors.pincode)}
                        helperText={errors.pincode?.message}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    onClick={checkPincode}
                  >
                    Verify PIN Code
                  </Button>
                </div>
                {pincodeErr && <Alert severity="error">{pincodeErr}</Alert>}
                {pincodeResult && (
                  <Alert severity="success">
                    PIN {pincodeResult.pincode} verified (
                    {pincodeResult.zone_name}).
                    {pincodeResult.own_partner_available
                      ? " Taantira Live Partner Delivery available!"
                      : " Shipped via Trusted Courier Partner."}
                    {pincodeResult.cod_available
                      ? " COD Available."
                      : " Prepaid UPI only."}
                  </Alert>
                )}
              </div>
            )}

            {/* Step 4: Delivery Method */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#3D1023]">
                  <Truck className="h-5 w-5 text-[#641B32]" /> 4. Select
                  Delivery Method
                </h2>
                <Controller
                  name="delivery_mode"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <FormControlLabel
                        value="own_partner"
                        control={<Radio />}
                        label="Taantira Own Delivery Partner (Live OpenFreeMap GPS tracking + OTP verification)"
                      />
                      <FormControlLabel
                        value="third_party_courier"
                        control={<Radio />}
                        label="Insured Courier Dispatch (Manual AWB & shipment milestone tracking)"
                      />
                    </RadioGroup>
                  )}
                />
              </div>
            )}

            {/* Step 5: Payment Method */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#3D1023]">
                  <Wallet className="h-5 w-5 text-[#641B32]" /> 5. Select Free
                  Direct Payment Method
                </h2>
                <Controller
                  name="payment_method"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <FormControlLabel
                        value="manual_upi"
                        control={<Radio />}
                        label="Direct UPI Transfer with Manual Admin Verification"
                      />
                      <FormControlLabel
                        value="cod"
                        control={<Radio />}
                        label="Cash on Delivery (COD)"
                      />
                    </RadioGroup>
                  )}
                />

                {watchedPaymentMethod === "manual_upi" && (
                  <div className="space-y-3 rounded-2xl border border-[#C39A52] bg-[#FFF9F2] p-4 text-xs">
                    <p className="font-bold text-[#641B32]">
                      Business UPI Details
                    </p>
                    <p>
                      Payee Name:{" "}
                      <strong>{checkoutConfig.upi_payee_name}</strong>
                    </p>
                    <p>
                      UPI ID / VPA:{" "}
                      <strong className="select-all text-sm text-[#3D1023]">
                        {checkoutConfig.upi_vpa}
                      </strong>
                    </p>
                    <p>
                      Amount Payable:{" "}
                      <strong>{formatINR(summary.totalAmount)}</strong>
                    </p>
                    <p className="text-[#641B32]/80">
                      Complete payment in any UPI app and enter your 12-digit
                      UTR / Reference number below (or submit it later from My
                      Orders). Order payment status updates to Paid only after
                      admin finance verification.
                    </p>
                    <Controller
                      name="upi_utr"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          size="small"
                          fullWidth
                          label="UTR / Reference Number (Optional now)"
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Review */}
            {activeStep === 5 && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#3D1023]">
                  <ShieldCheck className="h-5 w-5 text-[#641B32]" /> 6. Review
                  &amp; Confirm Order
                </h2>
                <div className="rounded-2xl bg-[#FFF9F2] p-4 text-xs space-y-1.5">
                  <p>
                    <strong>Deliver To:</strong> {watchedValues.recipient_name}{" "}
                    ({watchedValues.phone})
                  </p>
                  <p>
                    {watchedValues.address_line1}, {watchedValues.city},{" "}
                    {watchedValues.state} - {watchedValues.pincode}
                  </p>
                  <p>
                    <strong>Delivery Mode:</strong>{" "}
                    {watchedDeliveryMode === "own_partner"
                      ? "Taantira Own Delivery Partner"
                      : "Third-Party Courier"}
                  </p>
                  <p>
                    <strong>Payment:</strong>{" "}
                    {watchedPaymentMethod === "manual_upi"
                      ? "Manual UPI Verification"
                      : "Cash on Delivery"}
                  </p>
                </div>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      fullWidth
                      label="Delivery / Atelier Notes (Optional)"
                    />
                  )}
                />
                {submitErr && <Alert severity="error">{submitErr}</Alert>}
              </div>
            )}

            {/* Step 7: Confirmation */}
            {activeStep === 6 && orderConfirmation && (
              <div className="space-y-4 py-6 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" />
                <h2 className="font-serif text-2xl font-bold text-[#3D1023]">
                  Order {orderConfirmation.order?.order_number} Confirmed
                </h2>
                <p className="text-sm text-[#641B32]">
                  Payment Status:{" "}
                  <strong className="uppercase">
                    {orderConfirmation.order?.payment_status?.replace(
                      /_/g,
                      " ",
                    )}
                  </strong>
                </p>
                {orderConfirmation.order?.delivery_otp_code && (
                  <div className="mx-auto max-w-sm rounded-2xl border border-[#C39A52] bg-[#FFF9F2] p-4 text-xs">
                    <p className="font-semibold text-[#641B32]">
                      Your Secure Delivery OTP
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-[#3D1023]">
                      {orderConfirmation.order.delivery_otp_code}
                    </p>
                    <p className="mt-1 text-[#641B32]/75">
                      Share this OTP only with the Taantira partner when your
                      parcel arrives.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Link
                    to={`/account/orders/${orderConfirmation.order?.id}`}
                    className="rounded-full bg-[#641B32] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2]"
                  >
                    Track Order &amp; Details
                  </Link>
                  <Link
                    to="/store"
                    className="rounded-full border border-[#641B32] px-6 py-2.5 text-xs font-semibold text-[#641B32]"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}

            {/* Step Navigation */}
            {activeStep < 6 && (
              <div className="flex justify-between border-t border-[#F5E7E8] pt-4">
                <Button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => s - 1)}
                >
                  Back
                </Button>
                {activeStep < 5 ? (
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Placing Order..."
                      : "Confirm & Place Order"}
                  </Button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Summary Card */}
        {activeStep < 6 && (
          <div className="rounded-3xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm lg:col-span-4 lg:self-start">
            <h2 className="text-base font-bold text-[#3D1023]">
              Order Summary
            </h2>
            <div className="mt-4 space-y-2.5 border-b border-[#F5E7E8] pb-4 text-xs">
              {(summary.lineItems || []).map((line) => (
                <div
                  key={line.cart_item_id}
                  className="flex justify-between gap-2"
                >
                  <span>
                    {line.product_name} ({line.size}) &times; {line.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatINR(line.line_subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(summary.subtotal)}</span>
              </div>
              {Number(summary.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span>-{formatINR(summary.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes (GST)</span>
                <span>{formatINR(summary.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {Number(summary.shippingFee) === 0
                    ? "Free"
                    : formatINR(summary.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#D9A0A9]/40 pt-3 text-base font-bold text-[#641B32]">
                <span>Total</span>
                <span>{formatINR(summary.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
