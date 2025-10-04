import { paymentMiddleware, Network } from 'x402-next';

export const middleware = paymentMiddleware(
  "0x23178ccD27CDa5D5D18B211aD6648e189c1e16E1",
  {
    '/query': {
      price: '$0.01',
      network: "base-sepolia",
      config: {
        description: 'Access to query content'
      }
    },
  }
);

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/query/:path*',
    
  ],
  runtime: 'nodejs',
};