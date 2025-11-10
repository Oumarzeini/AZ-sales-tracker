import { supabase } from "./config.js";

// --- Modified to use Netlify Functions backend ---
// helper to call backend functions; requires the user's access token stored in session
async function apiFetch(path, options = {}) {
  const token = (await supabase.auth.getSession()).data?.session?.access_token;
  const headers = (options.headers || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;
  headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...options, headers });
  return res.json();
}


const successSvg = `<svg
        height=""
        width="25"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M256 42.667C138.18 42.667 42.667 138.18 42.667 256S138.18 469.334 256 469.334S469.334 373.82 469.334 256S373.821 42.667 256 42.667m0 384c-94.105 0-170.666-76.561-170.666-170.667S161.894 85.334 256 85.334S426.667 161.894 426.667 256S350.106 426.667 256 426.667m80.336-246.886l30.167 30.167l-131.836 132.388l-79.083-79.083l30.166-30.167l48.917 48.917z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>`;
const failedSvg = `<svg
          height="25"
          width="25"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M26.41 25L30 21.41L28.59 20L25 23.59L21.41 20L20 21.41L23.59 25L20 28.59L21.41 30L25 26.41L28.59 30L30 28.59L26.41 25zM18 2A12.035 12.035 0 0 0 6 14v6.2l-3.6-3.6L1 18l6 6l6-6l-1.4-1.4L8 20.2V14a10 10 0 0 1 20 0v3h2v-3A12.035 12.035 0 0 0 18 2z"
            fill="currentColor"
          />
        </svg>`;
const infoSvg = `<svg height="20" width="20" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
	<path d="m576 736l-32-.001v-286c0-.336-.096-.656-.096-1.008s.096-.655.096-.991c0-17.664-14.336-32-32-32h-64c-17.664 0-32 14.336-32 32s14.336 32 32 32h32v256h-32c-17.664 0-32 14.336-32 32s14.336 32 32 32h128c17.664 0 32-14.336 32-32s-14.336-32-32-32zm-64-384.001c35.344 0 64-28.656 64-64s-28.656-64-64-64s-64 28.656-64 64s28.656 64 64 64zm0-352c-282.768 0-512 229.232-512 512c0 282.784 229.232 512 512 512c282.784 0 512-229.216 512-512c0-282.768-229.216-512-512-512zm0 961.008c-247.024 0-448-201.984-448-449.01c0-247.024 200.976-448 448-448s448 200.977 448 448s-200.976 449.01-448 449.01z" fill="currentColor"/>
</svg>`;

const addDarkMode = () => {
  document.getElementById("dark_mode").style.display = "none";
  document.getElementById("light_mode").style.display = "block";
  document.body.classList.add("dark_mode");
  document.getElementById("selected_page").style.backgroundColor =
    "rgb(76, 75, 75)";
};

const addLightMode = () => {
  document.getElementById("light_mode").style.display = "none";
  document.getElementById("dark_mode").style.display = "block";
  document.body.classList.remove("dark_mode");
  document.getElementById("selected_page").style.backgroundColor =
    "rgb(240, 238, 238)";
};

if (localStorage.getItem("theme") === "dark") {
  addDarkMode();
} else {
  addLightMode();
}

const toggleDisplay = () => {
  document.getElementById("dark_mode").onclick = () => {
    localStorage.setItem("theme", "dark");
    window.location.reload();
  };
  document.getElementById("light_mode").onclick = () => {
    localStorage.setItem("theme", "light");
    window.location.reload();
  };
};

toggleDisplay();

const date = new Date().toDateString();
document.getElementById("dateDisplay").textContent = date;

const fetchSummary = async () => {
  const { data: day, error: dayError } = await apiFetch('/.netlify/functions/getActiveDay');

  if (dayError || !day) {
    console.error("No active day found:", dayError);
    showNotif("No active day found", infoSvg);
    return;
  }

  const activeDayId = day.id;

  const { data: sales, error: salesError } = await apiFetch(`/.netlify/functions/fetchSales?business_day_id=${activeDayId}`);

  if (salesError || !sales) {
    console.info("Error fetching sales:", salesError);
    showNotif("Error fetching sales, Please refresh the page.", failedSvg);
    document.getElementById("mostSold").textContent = ` No sales tracked`;
    document.getElementById("leastSold").textContent = `  No sales tracked`;
    document.getElementById("totalRevenue").textContent = `  No sales tracked`;
    return;
  }

  if (sales.length === 0) {
    console.log("No sales to track.");
    document.getElementById("mostSold").textContent = ` No sales tracked`;
    document.getElementById("leastSold").textContent = `  No sales tracked`;
    document.getElementById("totalRevenue").textContent = `  No sales tracked`;
    return;
  }

  const summary =
    Object.values(
      sales.reduce((acc, s) => {
        const name = s.items.name;
        const revenue = s.quantity * s.items.price;

        if (!acc[name]) {
          acc[name] = { name, quantity: 0, revenue: 0 };
        }

        acc[name].quantity += s.quantity;
        acc[name].revenue += revenue;

        return acc;
      }, {})
    ) || [];

  const mostSold = summary.reduce((max, item) =>
    item.quantity > max.quantity ? item : max
  );

  const leastSold = summary.reduce((min, item) =>
    item.quantity < min.quantity ? item : min
  );

  const totalRevenue = summary.reduce((sum, i) => sum + i.revenue, 0);

  document.getElementById(
    "mostSold"
  ).textContent = ` ${mostSold.name.toUpperCase()} : ${mostSold.quantity}`;
  document.getElementById(
    "leastSold"
  ).textContent = ` ${leastSold.name.toUpperCase()} : ${leastSold.quantity}`;
  document.getElementById("totalRevenue").textContent = ` ${totalRevenue} MAD`;
};

const showNotif = (text, icon) => {
  const notifContainer = document.getElementById("notifContainer");
  const progressBar = document.getElementById("progress_bar");

  const svgContainer = document.getElementById("svgContainer");
  svgContainer.innerHTML = icon;
  const notifText = document.getElementById("notifText");
  notifText.textContent = text;

  notifContainer.classList.add("show_notif");
  setTimeout(() => {
    progressBar.classList.add("move");
  }, 100);

  setTimeout(() => {
    notifContainer.classList.remove("show_notif");
    progressBar.classList.remove("move");
  }, 3300);
};

const subscribeToSalesUpdate = () => {
  const channel = supabase
    .channel("sales_updates")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "sales" },
      (payload) => {
        fetchSummary();
      }
    )
    .subscribe();
};

const checkAuth = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await fetchSummary();
  subscribeToSalesUpdate();
});