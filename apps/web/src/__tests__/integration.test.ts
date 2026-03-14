/**
 * StreamKit — Integration Test Suite
 * Sprint 3.5 | Sage WC110
 *
 * Tests: API routes with mocked DB, Redis, Stripe, auth, bcrypt
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const SESSION = {
  user: { id: 'user-abc', workspaceId: 'ws-abc', email: 'test@example.com' },
};

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
  handlers: {},
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// ── DB Mock — thenable + chainable, queue-based ────────────────────────────────

const _selectQueue: unknown[][] = [];
const _insertQueue: unknown[][] = []; // used for insert + update returning

function nextSelect() { return _selectQueue.shift() ?? []; }
function nextInsert() { return _insertQueue.shift() ?? []; }

const dbChain: Record<string, unknown> & PromiseLike<unknown[]> = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() => Promise.resolve(nextSelect())),
  returning: jest.fn().mockImplementation(() => Promise.resolve(nextInsert())),
  then(onFulfilled: (v: unknown[]) => unknown, onRejected?: (e: unknown) => unknown) {
    return Promise.resolve(nextSelect()).then(onFulfilled as any, onRejected as any);
  },
};

const updateWhereChain = {
  returning: jest.fn().mockImplementation(() => Promise.resolve(nextInsert())),
  then(onFulfilled: (v: unknown[]) => unknown, onRejected?: (e: unknown) => unknown) {
    return Promise.resolve(nextInsert()).then(onFulfilled as any, onRejected as any);
  },
};

const mockDb = {
  select: jest.fn().mockReturnValue(dbChain),
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue(dbChain),
  }),
  update: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue(updateWhereChain),
    }),
  }),
  delete: jest.fn().mockReturnValue({
    where: jest.fn().mockImplementation(() => Promise.resolve()),
  }),
};

jest.mock('@/lib/db', () => ({ db: mockDb }));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ _eq: [a, b] })),
  and: jest.fn((...a: unknown[]) => ({ _and: a })),
  sql: jest.fn((s: unknown) => s),
}));

jest.mock('@streamkit/db/schema', () => ({
  apiKeys: {},
  channels: {},
  eventLog: {},
  subscriptions: {},
  workspaces: {},
  users: {},
}));

jest.mock('nanoid', () => ({ nanoid: jest.fn().mockReturnValue('testslug12345') }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockConstructEvent = jest.fn();
const mockStripeInstance = {
  webhooks: { constructEvent: mockConstructEvent },
  checkout: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }) } },
  billingPortal: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal' }) } },
  subscriptions: {
    retrieve: jest.fn().mockResolvedValue({
      items: { data: [{ price: { id: 'price_pro_test' } }] },
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
    }),
  },
};
jest.mock('@/lib/stripe', () => ({ getStripe: jest.fn().mockReturnValue(mockStripeInstance) }));

const mockRedis = {
  publish: jest.fn().mockResolvedValue(1),
  get: jest.fn(),
  set: jest.fn(),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn(),
};
jest.mock('@/lib/redis', () => ({ getRedis: jest.fn().mockReturnValue(mockRedis) }));

const mockAuthApiKey = jest.fn().mockResolvedValue({
  workspaceId: 'ws-abc',
  apiKeyId: 'key-abc',
  tier: 'pro' as const,
  rateLimitPerMin: 60,
});
jest.mock('@/lib/api-key-auth', () => ({ authenticateApiKey: mockAuthApiKey }));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 59 }),
}));

jest.mock('@/lib/tier', () => ({
  getMonthlyEventLimit: jest.fn().mockReturnValue(10000),
  getChannelLimit: jest.fn().mockReturnValue(100),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth';
const mockAuth = auth as jest.MockedFunction<typeof auth>;

function withSession(session: typeof SESSION | null) {
  mockAuth.mockResolvedValue(session as any);
}

function withApiKey(result: { workspaceId: string; apiKeyId: string; tier: 'free' | 'pro' | 'business'; rateLimitPerMin: number } | null) {
  mockAuthApiKey.mockResolvedValue(result as any);
}

function queSelect<T>(rows: T[]) { _selectQueue.push(rows as unknown[]); }
function queInsert<T>(rows: T[]) { _insertQueue.push(rows as unknown[]); }

function makeRequest(method: string, url: string, body?: unknown, headers?: Record<string, string>): Request {
  return new Request(url, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Valid UUIDs for test data
const CHANNEL_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_CHANNEL_ID = '22222222-2222-2222-2222-222222222222';

beforeEach(() => {
  _selectQueue.length = 0;
  _insertQueue.length = 0;
  (dbChain.from as jest.Mock).mockReturnThis();
  (dbChain.where as jest.Mock).mockReturnThis();
  (dbChain.limit as jest.Mock).mockImplementation(() => Promise.resolve(nextSelect()));
  (dbChain.returning as jest.Mock).mockImplementation(() => Promise.resolve(nextInsert()));
  updateWhereChain.returning.mockImplementation(() => Promise.resolve(nextInsert()));
  mockDb.select.mockReturnValue(dbChain);
  mockDb.insert.mockReturnValue({ values: jest.fn().mockReturnValue(dbChain) });
  mockDb.update.mockReturnValue({
    set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue(updateWhereChain) }),
  });
  mockDb.delete.mockReturnValue({ where: jest.fn().mockImplementation(() => Promise.resolve()) });
  mockAuthApiKey.mockResolvedValue({ workspaceId: 'ws-abc', apiKeyId: 'key-abc', tier: 'pro', rateLimitPerMin: 60 });
  const { checkRateLimit } = jest.requireMock('@/lib/rate-limit') as { checkRateLimit: jest.Mock };
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 59 });
  const { getMonthlyEventLimit } = jest.requireMock('@/lib/tier') as { getMonthlyEventLimit: jest.Mock };
  getMonthlyEventLimit.mockReturnValue(10000);
  mockRedis.publish.mockResolvedValue(1);
  mockConstructEvent.mockReset();
});

// ── API Keys ──────────────────────────────────────────────────────────────────

describe('GET /api/api-keys', () => {
  it('401 when unauthenticated', async () => {
    withSession(null);
    const { GET } = await import('../app/api/api-keys/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('200 returns keys with prefix only (never full key or hash)', async () => {
    withSession(SESSION);
    const keys = [
      { id: 'k-1', name: 'Production', keyPrefix: 'sk_live_', isActive: true, lastUsedAt: null, createdAt: new Date() },
    ];
    queSelect(keys);
    const { GET } = await import('../app/api/api-keys/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    data.data.forEach((k: Record<string, unknown>) => {
      expect(k.keyHash).toBeUndefined();
      expect(k.key).toBeUndefined();
      expect(k.keyPrefix).toBeDefined();
    });
  });
});

describe('POST /api/api-keys', () => {
  it('401 when unauthenticated', async () => {
    withSession(null);
    const { POST } = await import('../app/api/api-keys/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/api-keys', { name: 'Test Key' }));
    expect(res.status).toBe(401);
  });

  it('422 on validation error (empty name)', async () => {
    withSession(SESSION);
    const { POST } = await import('../app/api/api-keys/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/api-keys', { name: '' }));
    expect(res.status).toBe(422);
  });

  it('201 creates key and returns full raw key ONCE', async () => {
    withSession(SESSION);
    queInsert([{ id: 'k-2', name: 'Production', keyPrefix: 'sk_live_', createdAt: new Date() }]);
    const { POST } = await import('../app/api/api-keys/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/api-keys', { name: 'Production' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe('success');
    // Full key returned on creation
    expect(data.data.key).toBeDefined();
    expect(data.data.key).toMatch(/^sk_live_/);
    // Hash never exposed
    expect(data.data.keyHash).toBeUndefined();
  });
});

// ── Channels ──────────────────────────────────────────────────────────────────

describe('GET /api/channels', () => {
  it('401 when unauthenticated', async () => {
    withSession(null);
    const { GET } = await import('../app/api/channels/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('200 returns workspace channels only', async () => {
    withSession(SESSION);
    queSelect([
      { id: CHANNEL_ID, workspaceId: 'ws-abc', name: 'notifications', slug: 'abcd1234', isPresenceEnabled: false, subscriberCount: 0, eventsThisHour: 0, createdAt: new Date() },
    ]);
    const { GET } = await import('../app/api/channels/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe('POST /api/channels', () => {
  it('401 when unauthenticated', async () => {
    withSession(null);
    const { POST } = await import('../app/api/channels/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/channels', { name: 'notifications' }));
    expect(res.status).toBe(401);
  });

  it('422 on empty name', async () => {
    withSession(SESSION);
    const { POST } = await import('../app/api/channels/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/channels', { name: '' }));
    expect(res.status).toBe(422);
  });

  it('201 creates channel with unique slug', async () => {
    withSession(SESSION);
    queInsert([{ id: CHANNEL_ID, workspaceId: 'ws-abc', name: 'notifications', slug: 'testslug', isPresenceEnabled: false, createdAt: new Date() }]);
    const { POST } = await import('../app/api/channels/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/channels', { name: 'notifications' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.data.slug).toBeDefined();
  });
});

// ── Events Publish ────────────────────────────────────────────────────────────

describe('POST /api/v1/events', () => {
  it('401 with invalid API key', async () => {
    withApiKey(null);
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: CHANNEL_ID, event: 'user.signup', payload: { userId: '1' },
    }, { 'X-StreamKit-Key': 'invalid-key' }));
    expect(res.status).toBe(401);
  });

  it('429 when rate limit exceeded', async () => {
    withApiKey({ workspaceId: 'ws-abc', apiKeyId: 'key-abc', tier: 'free', rateLimitPerMin: 10 });
    const { checkRateLimit } = jest.requireMock('@/lib/rate-limit') as { checkRateLimit: jest.Mock };
    checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0 });
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: CHANNEL_ID, event: 'user.signup', payload: {},
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(429);
  });

  it('404 when channel not found', async () => {
    queSelect([]); // channel lookup returns empty
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: CHANNEL_ID, event: 'test', payload: {},
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(404);
  });

  it('404 IDOR: channel belongs to another workspace', async () => {
    // API key is for ws-abc, but channel belongs to ws-xyz
    queSelect([{ id: OTHER_CHANNEL_ID, workspaceId: 'ws-xyz', name: 'other-channel' }]);
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: OTHER_CHANNEL_ID, event: 'test', payload: {},
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(404);
  });

  it('200 publishes event to Redis and returns event data', async () => {
    const channel = { id: CHANNEL_ID, workspaceId: 'ws-abc', name: 'notifications', eventsThisHour: 5 };
    const sub = { id: 'sub-1', workspaceId: 'ws-abc', eventsThisMonth: 100 };
    const inserted = { id: 'ev-1', channelId: CHANNEL_ID, eventName: 'user.signup', payload: {}, createdAt: new Date() };
    queSelect([channel]);   // channel lookup
    queSelect([sub]);        // subscription lookup
    queInsert([inserted]);   // eventLog insert returning
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: CHANNEL_ID, event: 'user.signup', payload: { userId: 'u-1' },
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.data.event).toBe('user.signup');
    expect(mockRedis.publish).toHaveBeenCalledWith(
      expect.stringContaining(CHANNEL_ID),
      expect.any(String),
    );
  });

  it('422 on validation error (missing event name)', async () => {
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: CHANNEL_ID, payload: {},
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(422);
  });
});

// ── Stripe Webhook ─────────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  it('400 when stripe-signature header missing', async () => {
    const { POST } = await import('../app/api/stripe/webhook/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/stripe/webhook', {}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/Missing signature/i);
  });

  it('400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementationOnce(() => { throw new Error('Webhook signature verification failed'); });
    const { POST } = await import('../app/api/stripe/webhook/route');
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'invalid-sig' },
      body: 'raw-body',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/Invalid signature/i);
  });

  it('200 with valid checkout.session.completed — upgrades tier', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          subscription: 'sub_test',
          metadata: { workspaceId: 'ws-abc' },
        },
      },
    };
    mockConstructEvent.mockReturnValueOnce(event);
    queSelect([{ id: 'sub-1', workspaceId: 'ws-abc' }]);
    const { POST } = await import('../app/api/stripe/webhook/route');
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid-sig' },
      body: JSON.stringify(event),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it('200 with customer.subscription.updated — updates status', async () => {
    const event = {
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_test', status: 'active', current_period_end: Math.floor(Date.now() / 1000) + 86400 } },
    };
    mockConstructEvent.mockReturnValueOnce(event);
    queSelect([{ id: 'sub-1', workspaceId: 'ws-abc', stripeSubscriptionId: 'sub_test' }]);
    const { POST } = await import('../app/api/stripe/webhook/route');
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid-sig' },
      body: JSON.stringify(event),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('200 with customer.subscription.deleted — downgrades to free', async () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_test' } },
    };
    mockConstructEvent.mockReturnValueOnce(event);
    const { POST } = await import('../app/api/stripe/webhook/route');
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid-sig' },
      body: JSON.stringify(event),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

// ── IDOR: Cross-Workspace Isolation ───────────────────────────────────────────

describe('IDOR: workspace isolation', () => {
  it('api-keys: GET only returns keys for authenticated workspace (no hash exposed)', async () => {
    withSession(SESSION);
    const ownKeys = [{
      id: 'k-1',
      workspaceId: 'ws-abc',
      name: 'Prod',
      keyPrefix: 'sk_live_',
      isActive: true,
      lastUsedAt: null,
      createdAt: new Date(),
    }];
    queSelect(ownKeys);
    const { GET } = await import('../app/api/api-keys/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    data.data.forEach((k: Record<string, unknown>) => {
      expect(k.keyHash).toBeUndefined();
      expect(k.key).toBeUndefined();
    });
  });

  it('event publish: 404 when API key workspace != channel workspace (IDOR blocked)', async () => {
    // API key authenticates to ws-abc, channel is in ws-xyz
    withApiKey({ workspaceId: 'ws-abc', apiKeyId: 'key-abc', tier: 'pro', rateLimitPerMin: 60 });
    queSelect([{ id: OTHER_CHANNEL_ID, workspaceId: 'ws-xyz', name: 'other' }]);
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: OTHER_CHANNEL_ID, event: 'test', payload: {},
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(404);
  });

  it('channels: 401 for unauthenticated request', async () => {
    withSession(null);
    const { GET } = await import('../app/api/channels/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ── Plan Limits ───────────────────────────────────────────────────────────────

describe('Plan limits', () => {
  it('event publish: 429 when monthly event limit exceeded', async () => {
    const channel = { id: CHANNEL_ID, workspaceId: 'ws-abc', name: 'notifications', eventsThisHour: 0 };
    const subAtLimit = { id: 'sub-1', workspaceId: 'ws-abc', eventsThisMonth: 1000 };
    queSelect([channel]);
    queSelect([subAtLimit]);
    const { getMonthlyEventLimit } = jest.requireMock('@/lib/tier') as { getMonthlyEventLimit: jest.Mock };
    getMonthlyEventLimit.mockReturnValueOnce(1000); // at limit
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: CHANNEL_ID, event: 'test', payload: {},
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(429);
  });

  it('event publish: 200 when under monthly limit', async () => {
    const channel = { id: CHANNEL_ID, workspaceId: 'ws-abc', name: 'notifications', eventsThisHour: 0 };
    const subUnderLimit = { id: 'sub-1', workspaceId: 'ws-abc', eventsThisMonth: 500 };
    const inserted = { id: 'ev-2', channelId: CHANNEL_ID, eventName: 'test', payload: {}, createdAt: new Date() };
    queSelect([channel]);
    queSelect([subUnderLimit]);
    queInsert([inserted]);
    const { POST } = await import('../app/api/v1/events/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/v1/events', {
      channelId: CHANNEL_ID, event: 'test', payload: { foo: 'bar' },
    }, { 'X-StreamKit-Key': 'sk_live_test' }));
    expect(res.status).toBe(200);
  });
});
