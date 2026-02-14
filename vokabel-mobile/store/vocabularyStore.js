import { supabase } from '../lib/supabase';

export const getVocabulary = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vocabulary:', error);
    return [];
  }
  return data || [];
};

export const addVocabularyItem = async (german, spanish) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vocabulary')
    .insert([
      { 
        german, 
        spanish, 
        user_id: user.id,
        status: 1 
      }
    ])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateVocabularyStatus = async (id, correct) => {
  const { data: item, error: fetchError } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  let statusIncreased = false;
  let tooSoon = false;
  let newStatus = item.status;
  const now = new Date();
  const last = new Date(item.lastReviewed || 0);
  const hoursSinceLast = (now - last) / (1000 * 60 * 60);

  if (correct) {
    if (hoursSinceLast < 12 && item.lastReviewed !== null) {
      tooSoon = true;
    } else {
      newStatus = Math.min(5, item.status + 1);
      if (newStatus > item.status) {
        statusIncreased = true;
      }
    }
  } else {
    newStatus = Math.max(1, item.status - 1);
  }

  const { data, error: updateError } = await supabase
    .from('vocabulary')
    .update({ 
      status: newStatus, 
      lastReviewed: now.toISOString() 
    })
    .eq('id', id)
    .select();

  if (updateError) throw updateError;
  return { updated: data[0], statusIncreased, tooSoon };
};

export const updateVocabularyItem = async (id, german, spanish) => {
  const { data, error } = await supabase
    .from('vocabulary')
    .update({ german, spanish })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteVocabularyItem = async (id) => {
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
