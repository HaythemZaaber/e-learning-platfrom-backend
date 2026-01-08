import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PayPalService {
  private readonly client: paypal.core.PayPalHttpClient;
  private readonly logger = new Logger(PayPalService.name);

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');
    const environment =
      this.configService.get('PAYPAL_ENVIRONMENT') || 'sandbox';

    if (!clientId || !clientSecret) {
      this.logger.warn('PayPal credentials not configured');
      return;
    }

    try {
      // Create PayPal environment
      const paypalEnvironment =
        environment === 'production'
          ? new paypal.core.LiveEnvironment(clientId, clientSecret)
          : new paypal.core.SandboxEnvironment(clientId, clientSecret);

      // Create PayPal client
      this.client = new paypal.core.PayPalHttpClient(paypalEnvironment);
    } catch (error) {
      this.logger.error('Error initializing PayPal client:', error);
      throw error;
    }
  }

  /**
   * Create a PayPal order
   */
  async createOrder(
    amount: number,
    currency: string,
    description: string,
    returnUrl: string,
    cancelUrl: string,
    metadata?: Record<string, any>,
  ): Promise<{ id: string; status: string; links: any[] } | null> {
    try {
      if (!this.client) {
        throw new Error('PayPal client not initialized');
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: (amount / 100).toFixed(2), // Convert from cents to dollars
            },
            description: description,
            custom_id: metadata?.courseId || '',
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'E-Learning Platform',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
        },
      });

      const response = await this.client.execute(request);

      if (response.statusCode === 201 && response.result) {
        const order = response.result;
        this.logger.log(`PayPal order created: ${order.id}`);
        return {
          id: order.id,
          status: order.status,
          links: order.links || [],
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error creating PayPal order:', error);
      throw error;
    }
  }

  /**
   * Capture a PayPal order
   */
  async captureOrder(orderId: string): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('PayPal client not initialized');
      }

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await this.client.execute(request);

      if (response.statusCode === 201 && response.result) {
        this.logger.log(`PayPal order captured: ${orderId}`);
        return response.result;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error capturing PayPal order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('PayPal client not initialized');
      }

      const request = new paypal.orders.OrdersGetRequest(orderId);
      const response = await this.client.execute(request);

      if (response.statusCode === 200 && response.result) {
        return response.result;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting PayPal order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<boolean> {
    try {
      // PayPal webhook verification would go here
      // For now, we'll return true if webhook is enabled
      const webhookId = this.configService.get('PAYPAL_WEBHOOK_ID');
      return !!webhookId;
    } catch (error) {
      this.logger.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  /**
   * Extract approval URL from order links
   */
  getApprovalUrl(links: any[]): string | null {
    const approvalLink = links?.find(
      (link) => link.rel === 'approve' || link.rel === 'approval_url',
    );
    return approvalLink?.href || null;
  }
}
