import { vi } from 'vitest';

export const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: { languages: [{ code: 'en', name: 'English', flag: '🇬🇧' }], current_language: 'en' }, error: null }),
  single: vi.fn().mockResolvedValue({ data: { status: 0, lastReviewed: null }, error: null }),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
};
