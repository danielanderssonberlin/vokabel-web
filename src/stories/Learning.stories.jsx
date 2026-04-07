import React from 'react';
import Learning from '../screens/Learning';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { LanguageProvider } from '../context/LanguageContext';
import { MemoryRouter } from 'react-router-dom';
import { fn, userEvent, within, expect } from '@storybook/test';
import { mockSupabase } from './MockSupabase';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

export default {
  title: 'Screens/Learning',
  component: Learning,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <UiLanguageProvider>
          <LanguageProvider>
            <div className="h-screen bg-background">
              <Story />
            </div>
          </LanguageProvider>
        </UiLanguageProvider>
      </MemoryRouter>
    ),
  ],
};

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check for "Lernen" title
    // await expect(canvas.getByText(/Lernen/i)).toBeInTheDocument();
    
    // Since it's loading initially, we might need to wait or mock the loading state
  },
};
