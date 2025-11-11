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
    // Find active day
    const { data: activeDay } = await supabase
      .from('business_days')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!activeDay) return { statusCode:200, body: JSON.stringify({ summary: null }) };

    const { data: sales } = await supabase
      .from('sales')
      .select('quantity, items(name, price, cost_price)')
      .eq('business_day_id', activeDay.id)
      .eq('user_id', user.id);

    const summary = Object.values(
      (sales || []).reduce((acc, s) => {
        const name = s.items.name;
        const revenue = s.quantity * s.items.price;
        const cost = s.items.cost_price ? s.quantity * s.items.cost_price : 0;

        if (!acc[name]) acc[name] = { name, quantity:0, revenue:0, cost:0 };
        acc[name].quantity += s.quantity;
        acc[name].revenue += revenue;
        acc[name].cost += cost;
        return acc;
      }, {})
    );

    const totalRevenue = summary.reduce((sum, i) => sum + i.revenue, 0);
    const totalCost = summary.reduce((sum, i) => sum + i.cost, 0);
    const netProfit = totalRevenue - totalCost;

    const mostSold = summary.length ? summary.reduce((max, item) => item.quantity > max.quantity ? item : max) : null;
    const leastSold = summary.length ? summary.reduce((min, item) => item.quantity < min.quantity ? item : min) : null;

    return { statusCode:200, body: JSON.stringify({ summary, totalRevenue, totalCost, netProfit, mostSold, leastSold }) };
  } catch (err) {
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
