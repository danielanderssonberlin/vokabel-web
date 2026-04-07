import React from 'react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { UiLanguageProvider } from '../context/UiLanguageContext';
import { fn, userEvent, within, expect } from '@storybook/test';

export default {
  title: 'Components/DeleteConfirmModal',
  component: DeleteConfirmModal,
  decorators: [
    (Story) => (
      <UiLanguageProvider>
        <div className="p-4">
          <Story />
        </div>
      </UiLanguageProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    isOpen: true,
    onClose: fn(),
    onConfirm: fn(),
    title: 'Test Title',
    message: 'Test message for deletion confirm.',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Check if title and message are rendered
    await expect(canvas.getByText('Test Title')).toBeInTheDocument();
    await expect(canvas.getByText('Test message for deletion confirm.')).toBeInTheDocument();
    
    // Test cancel button
    const cancelButton = canvas.getByRole('button', { name: /Abbrechen/i }); // Assuming 'de' is default and 'Abbrechen' is in COMMON.CANCEL
    await userEvent.click(cancelButton);
    await expect(args.onClose).toHaveBeenCalled();
    
    // Test confirm button
    const confirmButton = canvas.getByRole('button', { name: /Löschen/i }); // Assuming DELETE_MODAL.CONFIRM is 'Löschen'
    await userEvent.click(confirmButton);
    await expect(args.onConfirm).toHaveBeenCalled();
  },
};

export const Closed = {
  args: {
    isOpen: false,
    onClose: fn(),
    onConfirm: fn(),
  },
};
