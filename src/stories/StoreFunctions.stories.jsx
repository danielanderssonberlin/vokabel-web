import React, { useState } from 'react';
import { getUserStats, updateStudyStats, calculateStatsFromVocabulary } from '../store/userStore';
import { getVocabulary, addVocabularyItem, updateVocabularyStatus, updateVocabularyItem, deleteVocabularyItem } from '../store/vocabularyStore';
import { fn, userEvent, within, expect } from '@storybook/test';
import { mockSupabase } from './MockSupabase';
import { vi } from 'vitest';

// Mock supabase for this test
vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

const FunctionTester = () => {
  const [results, setResults] = useState({});

  const runTests = async () => {
    const res = {};
    
    // Test userStore functions (these use localStorage)
    const stats = getUserStats('test-user');
    res.getUserStats = !!stats;
    
    const updatedStats = updateStudyStats('test-user');
    res.updateStudyStats = updatedStats.streak >= 0;
    
    const calculated = calculateStatsFromVocabulary([{ lastReviewed: new Date().toISOString() }]);
    res.calculateStatsFromVocabulary = calculated.streak === 1;

    // Test vocabularyStore functions (these use supabase)
    const vocab = await getVocabulary('en');
    res.getVocabulary = Array.isArray(vocab);
    
    try {
      const newItem = await addVocabularyItem('Hallo', 'Hello', 'en');
      res.addVocabularyItem = !!newItem;
    } catch (e) { res.addVocabularyItem = false; }
    
    try {
      const statusRes = await updateVocabularyStatus('test-id', true);
      res.updateVocabularyStatus = !!statusRes.updated;
    } catch (e) { res.updateVocabularyStatus = false; }
    
    try {
      const updateRes = await updateVocabularyItem('test-id', 'Hallo2', 'Hello2');
      res.updateVocabularyItem = !!updateRes;
    } catch (e) { res.updateVocabularyItem = false; }
    
    try {
      await deleteVocabularyItem('test-id');
      res.deleteVocabularyItem = true;
    } catch (e) { res.deleteVocabularyItem = false; }

    setResults(res);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <button 
        onClick={runTests}
        className="px-4 py-2 bg-primary text-white rounded mb-4"
        id="run-tests"
      >
        Run Store Function Tests
      </button>
      <div className="space-y-2">
        {Object.entries(results).map(([name, success]) => (
          <div key={name} className="flex items-center gap-2">
            <span className={success ? "text-success" : "text-error"}>
              {success ? "✅" : "❌"}
            </span>
            <span className="font-mono text-sm">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  title: 'Internal/StoreFunctions',
  component: FunctionTester,
};

export const Tests = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /Run Store Function Tests/i });
    
    await userEvent.click(button);
    
    // Wait for all results to appear
    await expect(canvas.getByText('getUserStats')).toBeInTheDocument();
    await expect(canvas.getByText('updateStudyStats')).toBeInTheDocument();
    await expect(canvas.getByText('calculateStatsFromVocabulary')).toBeInTheDocument();
    await expect(canvas.getByText('getVocabulary')).toBeInTheDocument();
    await expect(canvas.getByText('addVocabularyItem')).toBeInTheDocument();
    await expect(canvas.getByText('updateVocabularyStatus')).toBeInTheDocument();
    await expect(canvas.getByText('updateVocabularyItem')).toBeInTheDocument();
    await expect(canvas.getByText('deleteVocabularyItem')).toBeInTheDocument();
    
    // Check if they all passed
    const successes = canvas.getAllByText('✅');
    await expect(successes.length).toBe(8);
  },
};
