import React from 'react';
import { UI_STRINGS } from '../constants/uiContent';

// Mock context providers for Storybook
export const withMockProviders = (Story) => {
  // Mock implementations for useUiLanguage and useLanguage would normally go here
  // but since we want to test with real logic as much as possible, 
  // we can provide simpler versions of the providers.
  
  return (
    <div className="p-4 bg-background min-h-[200px]">
      <Story />
    </div>
  );
};
