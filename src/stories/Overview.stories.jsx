import React from 'react';
import Overview from '../screens/Overview';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { LanguageProvider } from '../context/LanguageContext';
import { MemoryRouter } from 'react-router-dom';
import { fn, userEvent, within, expect } from '@storybook/test';
import { mockSupabase } from './MockSupabase';
import { vi } from 'vitest';

// Mock supabase for the entire story
vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

export default {
  title: 'Screens/Overview',
  component: Overview,
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
    
    // Check if header is rendered
    await expect(canvas.getByText(/Übersicht/i)).toBeInTheDocument();
    
    // Check if search bar exists
    await expect(canvas.getByPlaceholderText(/Suchen/i)).toBeInTheDocument();
    
    // Check if add button exists
    const addButton = canvas.getByRole('button', { name: '' }); // The Floating Action Button usually doesn't have a name unless set
    // Actually, it has <Plus size={30} />, we can find by that or just by tag
  },
};
