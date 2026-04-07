import React from 'react';
import Profile from '../screens/Profile';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { LanguageProvider } from '../context/LanguageContext';
import { MemoryRouter } from 'react-router-dom';
import { fn, userEvent, within, expect } from '@storybook/test';
import { mockSupabase } from './MockSupabase';
import { vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

export default {
  title: 'Screens/Profile',
  component: Profile,
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
    
    // Check for profile title
    await expect(canvas.getByText(/Profil & Einstellungen/i)).toBeInTheDocument();
  },
};
