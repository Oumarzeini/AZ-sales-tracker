import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Helper: verify bearer token and return user id
async function verifyToken(event) {
  const auth = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!auth || !auth.startsWith('Bearer ')) {
    return { error: 'Missing auth token' };
  }
  const token = auth.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { error: error?.message || 'Invalid token' };
  return { user: data.user };
}

export async function handler(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };
  const verification = await verifyToken(event);
  if (verification.error) return { statusCode: 401, body: JSON.stringify({ error: verification.error }) };
  const user = verification.user;
  try {
    const { data, error } = await supabase
      .from('business_days')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) {
      // no active day
      return { statusCode: 200, body: JSON.stringify({ data: null }) };
    }
    return { statusCode: 200, body: JSON.stringify({ data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
