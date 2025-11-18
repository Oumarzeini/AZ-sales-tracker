import supabase from "./config.js";
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

const overlay = document.getElementById("overlay");
const logOutModel = document.getElementById("logOutModel");
const cancelLogOut = document.getElementById("cancelLogOut");
const confirmLogOut = document.getElementById("confirmLogOut");

let activeDayId = null;
//Profile icon
const profileIcon = document.getElementById("profileIcon");
profileIcon.onclick = () => {
  document.getElementById("profileCard").classList.toggle("show");
};

document.getElementById("closeProfileCard").onclick = () => {
  document.getElementById("profileCard").classList.remove("show");
};

// LOG OUT HANDLE
const signOut = async () => {
  const { data, error: signOutErr } = await supabase.auth.signOut();
  if (signOutErr) {
    console.log(`Error signing out : ${signOutErr}`);
    showNotif(`Error signing out : ${signOutErr}`, failedSvg);
    return;
  }

  window.location.href = "index.html";
};

document.getElementById("logOut").onclick = () => {
  overlay.style.display = "block";
  logOutModel.style.display = "flex";
};

cancelLogOut.onclick = () => {
  overlay.style.display = "none";
  logOutModel.style.display = "none";
};

confirmLogOut.onclick = async () => {
  await signOut();
};

//Email Display
const getUserEmail = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.log("Error getting user email : ", error.message);
    return;
  }
  document.getElementById("userEmail").textContent = user.email;
};

getUserEmail();

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

const fetchSalesSummary = async () => {
  const { data, error } = await supabase
    .from("business_days")
    .select("id")
    .eq("is_active", true)
    .single();

  if (error) {
    try {
      activeDayId = await checkOrCreateBusinessDay();
    } catch (err) {
      console.log(err.message);
      showNotif(err.message, failedSvg);
      return;
    }
  }

  activeDayId = data.id;

  const { data: items, error: itemsError } = await supabase
    .from("sales")
    .select("quantity, items(name, price)")
    .eq("business_day_id", activeDayId);

  if (itemsError) {
    showNotif("An error occured, Please refresh the page.", failedSvg);
    return;
  }
  const salesSummary = Object.values(
    items.reduce((acc, s) => {
      const name = s.items.name;
      const revenue = s.quantity * s.items.price;

      if (!acc[name]) {
        acc[name] = { name, quantity: 0, revenue: 0 };
      }

      acc[name].quantity += s.quantity;
      acc[name].revenue += revenue;

      return acc;
    }, {})
  );

  const salesTable = document.getElementById("salesTable");
  salesTable.innerHTML = ``;
  const noItemsFeedback = document.createElement("p");
  noItemsFeedback.textContent = "No sales tracked for today";
  noItemsFeedback.classList.add("noItemsFeedback");

  if (!salesSummary.length) {
    salesTable.append(noItemsFeedback);
    return;
  }

  salesSummary.forEach((sale) => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("table_row");
    rowDiv.innerHTML = `<p>${sale.name}</p> <p>${sale.quantity}</p> <p style="text-align: right;">${sale.revenue}</p>`;

    salesTable.append(rowDiv);
  });

  let totalDailyRevenue = salesSummary.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const totalRevenueDisplay = document.getElementById("totalRevenueDisplay");
  totalRevenueDisplay.textContent = `${totalDailyRevenue} MAD`;
};

const subscribeToSalesUpdate = () => {
  const channel = supabase
    .channel("sales_updates")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "sales" },
      (payload) => {
        fetchSalesSummary();
      }
    )
    .subscribe();
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

const checkOrCreateBusinessDay = async () => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const { data: lastDay, error } = await supabase
    .from("business_days")
    .select("*")
    .order("open_time", { ascending: false })
    .limit(1);

  if (error) {
    console.log("Error fetching business day", error);
    showNotif("An error occured, Please refresh the page", failedSvg);
    return;
  }

  if (!lastDay || lastDay.length === 0) {
    return await startNewDay(today);
  }

  const day = lastDay[0];
  const dayDate = day.date_label;

  if (dayDate === today && day.is_active) {
    console.log("using current day !");
    activeDayId = day.id;
    return activeDayId;
  }

  if (dayDate !== today) {
    console.log("Closing old business day !");
    await closeDay(day.id);
    await startNewDay(today);
    return activeDayId;
  }

  if (dayDate === today && !day.is_active) {
    console.log("Reactivating existing business day!");
    const { error: updateError } = await supabase
      .from("business_days")
      .update({ is_active: true, open_time: new Date().toISOString() })
      .eq("id", day.id);

    if (updateError) {
      console.warn("Error reactivating day", updateError.message);
      showNotif(
        "An error occurred while reopening the business day.",
        failedSvg
      );
      return;
    }

    activeDayId = day.id;
    showNotif("Business day reopened", infoSvg);
    return activeDayId;
  }
};

const startNewDay = async (today) => {
  const { data, error } = await supabase
    .from("business_days")
    .insert([{ date_label: today }])
    .select("id");

  if (error) {
    console.warn("Error starting new business day ", error.message);
    showNotif("An error occured, Please refresh the page.", failedSvg);
    return;
  }

  activeDayId = data[0].id;
  showNotif("New business day started", infoSvg);
};

const closeDay = async (activeDayId) => {
  const { data: sales, error } = await supabase
    .from("sales")
    .select("quantity, items(price)")
    .eq("business_day_id", activeDayId);

  if (error) {
    console.log(
      "Error fetching today sales, Refresh to try again., Error: ",
      error
    );
    showNotif("An error occured, Please refresh the page.", failedSvg);
    return;
  }

  const totalRevenue = sales.reduce(
    (sum, s) => sum + s.quantity * s.items.price,
    0
  );
  const totalItems = sales.reduce((sum, s) => sum + s.quantity, 0);

  const today = new Date().toISOString().split("T")[0];

  const { data, error: saveErr } = await supabase.from("daily_summary").insert([
    {
      business_day_id: activeDayId,
      date: today,
      total_revenue: totalRevenue,
      total_items_sold: totalItems,
    },
  ]);

  if (saveErr) {
    console.log(
      "Error saving today sales to the summary , Please Refresh, Error:",
      saveErr
    );
    showNotif("An error occured, Please refresh the page.", failedSvg);
    return;
  }

  const { error: closingErr } = await supabase
    .from("business_days")
    .update([{ is_active: false, close_time: new Date().toISOString() }])
    .eq("id", activeDayId);
  if (closingErr) {
    console.log(closingErr);
    showNotif("An error occured, Please refresh teh page.", failedSvg);
  }
};

const checkAuth = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await checkOrCreateBusinessDay();
  await fetchSalesSummary();
  subscribeToSalesUpdate();
});
