import React from 'react';
import Login from '../screens/Login';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { MemoryRouter } from 'react-router-dom';
import { fn, userEvent, within, expect } from '@storybook/test';
import { mockSupabase } from './MockSupabase';
import { vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

export default {
  title: 'Screens/Login',
  component: Login,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <UiLanguageProvider>
          <div className="h-screen bg-background p-4">
            <Story />
          </div>
        </UiLanguageProvider>
      </MemoryRouter>
    ),
  ],
};

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check for login title
    await expect(canvas.getByText(/Melde dich an/i)).toBeInTheDocument();
    
    // Fill login
    const emailInput = canvas.getByPlaceholderText(/deine@email.de/i);
    const passInput = canvas.getByPlaceholderText('••••••••');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passInput, 'password123');
    
    const submitButton = canvas.getByRole('button', { name: /Anmelden/i });
    await userEvent.click(submitButton);
    
    // Supabase should have been called
    await expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
  },
};
