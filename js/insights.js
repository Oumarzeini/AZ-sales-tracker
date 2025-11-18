import supabase from "./config.js";

// GETTING THE STARTING DAY
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const convertSunday = day === 0 ? 7 : day;
  d.setDate(d.getDate() - convertSunday + 1);
  return d;
};

// GROUPPING BY WEEK
const groupByWeek = (sales) => {
  const weeks = {};

  sales.forEach((s) => {
    const weekStart = getWeekStart(s.created_at).toISOString().split("T")[0];

    if (!weeks[weekStart]) {
      weeks[weekStart] = {
        items: 0,
        revenue: 0,
        itemsMap: {},
      };
    }

    weeks[weekStart].items += s.quantity;
    weeks[weekStart].revenue += s.total;

    const itemName = s.items.name;

    if (!weeks[weekStart].itemsMap[itemName]) {
      weeks[weekStart].itemsMap[itemName] = 0;
    }

    weeks[weekStart].itemsMap[itemName] += s.quantity;
  });

  return weeks;
};

// FINDING MOST AND LEAST SOLD ITEMS
const findMostAndLeast = (itemsMap) => {
  const entries = Object.entries(itemsMap);

  entries.sort((a, b) => b[1] - a[1]);
  return {
    most: entries[0],
    least: entries[entries.length - 1],
  };
};

// FORMAT DATE HELPER FUNC
const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB");
};

// console.log(formatDate("2025-10-17 18:42:58.990767+00"));

// RENDERING
const renderInsightsTable = (weeks) => {
  const container = document.getElementById("container");
  container.innerHTML = "";

  for (const start in weeks) {
    const w = weeks[start];
    const { most, least } = findMostAndLeast(w.itemsMap);

    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 6);

    const tableCard = `

        <table>
          <caption id="weekDate">
            ${formatDate(start)} - ${formatDate(endDate)}
          </caption>
          <thead>
            <tr>
              <td>ITEMS SOLD</td>
              <td>TOTAL REVENUE</td>
              <td>MOST SOLD</td>
              <td>LEAST SOLD</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${w.items}</td>
              <td>${w.revenue} MAD</td>
              <td>${most[0]} (${most[1]})</td>
              <td>${least[0]} (${least[1]})</td>
            </tr>
          </tbody>
        </table>
        `;

    container.innerHTML += tableCard;
  }
};

const loadInsights = async () => {
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr) {
    console.log(`Error getting user : ${userErr.message}`);
  }

  const user = userData.user;

  const { data: sales, error } = await supabase
    .from("sales")
    .select("item_id, quantity, total, created_at, items(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(`Error getting sales : ${error.message}`);
  }

  const weeks = groupByWeek(sales);
  renderInsightsTable(weeks);
};

const checkAuth = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await loadInsights();
});
