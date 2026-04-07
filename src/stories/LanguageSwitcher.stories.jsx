import React from 'react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { LanguageProvider } from '../context/LanguageContext';
import { fn, userEvent, within, expect } from '@storybook/test';

export default {
  title: 'Components/LanguageSwitcher',
  component: LanguageSwitcher,
  decorators: [
    (Story) => (
      <UiLanguageProvider>
        <LanguageProvider>
          <div className="p-10 min-h-[300px]">
            <Story />
          </div>
        </LanguageProvider>
      </UiLanguageProvider>
    ),
  ],
};

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Check if it's rendered (flag might be empty if no languages)
    await expect(button).toBeInTheDocument();
    
    // Open dropdown
    await userEvent.click(button);
    
    // Check if dropdown items are visible
    // Note: This depends on what languages are in the mock/localStorage
    // Since we use real providers, they will try to fetch from Supabase or localStorage.
  },
};
