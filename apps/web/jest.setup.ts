// Jest setup for StreamKit integration tests
process.env.NEXTAUTH_SECRET = 'test-secret-for-jest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_PRICE_PRO = 'price_pro_test';
process.env.STRIPE_PRICE_BUSINESS = 'price_business_test';
