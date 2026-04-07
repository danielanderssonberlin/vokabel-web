import React from 'react';
import Welcome from '../screens/Welcome';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { MemoryRouter } from 'react-router-dom';
import { fn, userEvent, within, expect } from '@storybook/test';

export default {
  title: 'Screens/Welcome',
  component: Welcome,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <UiLanguageProvider>
          <div className="h-screen bg-background">
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
    
    // Check for "Jetzt loslegen" button
    await expect(canvas.getByText(/Jetzt loslegen/i)).toBeInTheDocument();
  },
};
