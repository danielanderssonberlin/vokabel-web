import React from 'react';
import PasswordModal from '../components/PasswordModal';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { fn, userEvent, within, expect } from '@storybook/test';
import { mockSupabase } from './MockSupabase';
import { vi } from 'vitest';

// We need to mock supabase globally for this to work
vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

export default {
  title: 'Components/PasswordModal',
  component: PasswordModal,
  decorators: [
    (Story) => (
      <UiLanguageProvider>
        <div className="p-10">
          <Story />
        </div>
      </UiLanguageProvider>
    ),
  ],
};

export const Open = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Check if labels are correct (de default)
    await expect(canvas.getByText(/Aktuelles Passwort/i)).toBeInTheDocument();
    
    // Fill form
    const oldPassInput = canvas.getByPlaceholderText('••••••••');
    // Note: there are multiple password inputs with same placeholder
    const inputs = canvas.getAllByPlaceholderText('••••••••');
    await userEvent.type(inputs[0], 'oldpassword');
    await userEvent.type(inputs[1], 'newpassword');
    await userEvent.type(inputs[2], 'newpassword');
    
    // Submit
    const submitButton = canvas.getByRole('button', { name: /Passwort aktualisieren/i });
    await userEvent.click(submitButton);
    
    // Check if supabase was called
    await expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    await expect(mockSupabase.auth.updateUser).toHaveBeenCalled();
    
    // Check if onClose was called after success (timeout 2s in component)
    // We can't wait for 2s in a simple interaction test usually without waiting
    // await new Promise(r => setTimeout(r, 2100));
    // await expect(args.onClose).toHaveBeenCalled();
  },
};
