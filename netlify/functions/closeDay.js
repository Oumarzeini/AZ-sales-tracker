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
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const verification = await verifyToken(event);
  if (verification.error) return { statusCode: 401, body: JSON.stringify({ error: verification.error }) };
  const user = verification.user;

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { business_day_id } = body;
  if (!business_day_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing business_day_id' }) };

  try {
    const { data: sales, error: sErr } = await supabase
      .from('sales')
      .select('quantity, items(price)')
      .eq('business_day_id', business_day_id)
      .eq('user_id', user.id);

    if (sErr) return { statusCode: 500, body: JSON.stringify({ error: sErr.message }) };

    const totalRevenue = sales.reduce((sum, s) => sum + s.quantity * s.items.price, 0);
    const totalItems = sales.reduce((sum, s) => sum + s.quantity, 0);

    // insert into daily_summary
    const { data, error } = await supabase
      .from('daily_summary')
      .insert([{
        business_day_id,
        date: new Date().toISOString().split('T')[0],
        total_revenue: totalRevenue,
        total_items_sold: totalItems,
        user_id: user.id
      }])
      .select();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    // mark day closed
    await supabase
      .from('business_days')
      .update({ is_active: false, close_time: new Date().toISOString() })
      .eq('id', business_day_id)
      .eq('user_id', user.id);

    return { statusCode: 200, body: JSON.stringify({ success: true, summary: data[0] }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
