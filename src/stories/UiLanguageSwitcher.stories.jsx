import React from 'react';
import UiLanguageSwitcher from '../components/UiLanguageSwitcher';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { fn, userEvent, within, expect } from '@storybook/test';

export default {
  title: 'Components/UiLanguageSwitcher',
  component: UiLanguageSwitcher,
  decorators: [
    (Story) => (
      <UiLanguageProvider>
        <div className="p-4">
          <Story />
        </div>
      </UiLanguageProvider>
    ),
  ],
};

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const deButton = canvas.getByText('DE');
    const enButton = canvas.getByText('EN');
    
    await expect(deButton).toBeInTheDocument();
    await expect(enButton).toBeInTheDocument();
    
    // Test language switch
    await userEvent.click(enButton);
    await expect(enButton).toHaveClass('bg-primary');
    
    await userEvent.click(deButton);
    await expect(deButton).toHaveClass('bg-primary');
  },
};
