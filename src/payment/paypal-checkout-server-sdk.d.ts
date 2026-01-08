declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export class PayPalHttpClient {
      constructor(environment: PayPalEnvironment);
      execute<T = any>(
        request: any,
      ): Promise<{ statusCode: number; result?: T }>;
    }

    export class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    export class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    export type PayPalEnvironment = LiveEnvironment | SandboxEnvironment;
  }

  export namespace orders {
    export class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: any): void;
    }

    export class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: any): void;
    }

    export class OrdersGetRequest {
      constructor(orderId: string);
    }
  }
}
