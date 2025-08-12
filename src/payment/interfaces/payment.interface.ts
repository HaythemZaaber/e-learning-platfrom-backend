export interface PaymentSessionResponse {
  success: boolean;
  session: any;
  redirectUrl?: string;
  error?: string;
}

export interface CouponValidationResponse {
  isValid: boolean;
  coupon?: any;
  discountAmount: number;
  finalAmount: number;
  error?: string;
}

export interface EnrollmentResponse {
  success: boolean;
  enrollment: any;
  error?: string;
}

export interface PaymentWebhookData {
  event: string;
  data: any;
  signature: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  status: string;
  payment_intent?: string;
  metadata: Record<string, any>;
}

export interface PaymentMethodData {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string;
    email?: string;
    address?: any;
  };
}
