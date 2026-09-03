import supabase from "./config.js";

// GETTING THE STARTING DAY
const getWeekStart = (date) => {
  const currentDate = new Date(date);
  const day = currentDate.getDay();
  const convertSunday = day === 0 ? 7 : day;
  currentDate.setDate(currentDate.getDate() - convertSunday + 1);
  return currentDate;
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
        cost: 0,
        itemsMap: {},
      };
    }

    weeks[weekStart].items += s.quantity;
    weeks[weekStart].revenue += s.total;
    weeks[weekStart].cost += s.items.cost * s.quantity;

    const itemName = s.items.name;

    if (!weeks[weekStart].itemsMap[itemName]) {
      weeks[weekStart].itemsMap[itemName] = 0;
    }

    weeks[weekStart].itemsMap[itemName] += s.quantity;
  });

  return weeks;
};

const findMostAndLeast = (itemsMap) => {
  const entries = Object.entries(itemsMap);

  entries.sort((a, b) => b[1] - a[1]);
  return {
    most: entries[0],
    least: entries[entries.length - 1],
  };
};

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
    const week = weeks[start];
    const { most, least } = findMostAndLeast(week.itemsMap);

    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 6);

    const grossProfit = week.revenue - week.cost;
    //console.log(week.revenue, week.cost, grossProfit);
    //console.log(week);

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
              <td>GROSS PROFIT</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${week.items}</td>
              <td>${week.revenue} MAD</td>
              <td>${most[0]} (${most[1]})</td>
              <td>${least[0]} (${least[1]})</td>
              <td>${grossProfit} MAD</td>
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
    return;
  }

  const user = userData.user;

  const { data: sales, error } = await supabase
    .from("sales")
    .select("item_id, quantity, total, created_at, items(name, cost)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(`Error getting sales : ${error.message}`);
    return;
  }

  if (!sales.length) {
    document.querySelector(".container").innerHTML =
      `<p style="text-align: center;" >No sales tracked this week yet. </p>`;
    return;
  }

  const weeks = groupByWeek(sales);
  renderInsightsTable(weeks);
};

const checkAuth = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "auth.html";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await loadInsights();
});
