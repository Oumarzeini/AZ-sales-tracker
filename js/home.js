import supabase from "./config.js";
import capitalize from "./utils/capitalize.js";
import getUser from "./utils/getUser.js";

const successSvg = `
  <svg
    height="25"
    width="25"
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M256 42.667C138.18 42.667 42.667 138.18 42.667 256S138.18 469.334 256 469.334S469.334 373.82 469.334 256S373.821 42.667 256 42.667m0 384c-94.105 0-170.666-76.561-170.666-170.667S161.894 85.334 256 85.334S426.667 161.894 426.667 256S350.106 426.667 256 426.667m80.336-246.886l30.167 30.167l-131.836 132.388l-79.083-79.083l30.166-30.167l48.917 48.917z"
      fill="currentColor"
      fill-rule="evenodd"
    />
  </svg>
`;

const failedSvg = `
  <svg
    height="25"
    width="25"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M26.41 25L30 21.41L28.59 20L25 23.59L21.41 20L20 21.41L23.59 25L20 28.59L21.41 30L25 26.41L28.59 30L30 28.59L26.41 25zM18 2A12.035 12.035 0 0 0 6 14v6.2l-3.6-3.6L1 18l6 6l6-6l-1.4-1.4L8 20.2V14a10 10 0 0 1 20 0v3h2v-3A12.035 12.035 0 0 0 18 2z"
      fill="currentColor"
    />
  </svg>
`;

const infoSvg = `
  <svg
    height="20"
    width="20"
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="m576 736l-32-.001v-286c0-.336-.096-.656-.096-1.008s.096-.655.096-.991c0-17.664-14.336-32-32-32h-64c-17.664 0-32 14.336-32 32s14.336 32 32 32h32v256h-32c-17.664 0-32 14.336-32 32s14.336 32 32 32h128c17.664 0 32-14.336 32-32s-14.336-32-32-32zm-64-384.001c35.344 0 64-28.656 64-64s-28.656-64-64-64s-64 28.656-64 64s28.656 64 64 64zm0-352c-282.768 0-512 229.232-512 512c0 282.784 229.232 512 512 512c282.784 0 512-229.216 512-512c0-282.768-229.216-512-512-512zm0 961.008c-247.024 0-448-201.984-448-449.01c0-247.024 200.976-448 448-448s448 200.977 448 448s-200.976 449.01-448 449.01z"
      fill="currentColor"
    />
  </svg>
`;

let activeDayId = null;

const elements = {
  overlay: document.getElementById("overlay"),
  logOutModal: document.getElementById("logOutModel"),
  cancelLogOut: document.getElementById("cancelLogOut"),
  confirmLogOut: document.getElementById("confirmLogOut"),

  profileIcon: document.getElementById("profileIcon"),
  profileCard: document.getElementById("profileCard"),
  closeProfileCard: document.getElementById("closeProfileCard"),

  userEmail: document.getElementById("userEmail"),

  darkModeButton: document.getElementById("dark_mode"),
  lightModeButton: document.getElementById("light_mode"),
  selectedPage: document.getElementById("selected_page"),

  salesTable: document.getElementById("salesTable"),
  tableBody: document.getElementById("table-body"),
  totalRevenueDisplay: document.getElementById("totalRevenueDisplay"),

  notifContainer: document.getElementById("notifContainer"),
  progressBar: document.getElementById("progress_bar"),
  svgContainer: document.getElementById("svgContainer"),
  notifText: document.getElementById("notifText"),

  logOutButton: document.getElementById("logOut"),
};

const showNotif = (text, icon) => {
  const { notifContainer, progressBar, svgContainer, notifText } = elements;

  svgContainer.innerHTML = icon;
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

//AUTH

const checkAuth = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error checking session:", error);
    return false;
  }

  if (!session) {
    window.location.href = "auth.html";
    return false;
  }

  return true;
};

const displayUserEmail = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error);

    if (error.message?.toLowerCase().includes("expired")) {
      showNotif("Session expired. Please sign in again.", infoSvg);

      setTimeout(() => {
        window.location.href = "auth.html";
      }, 3000);
    }

    return;
  }

  if (user) {
    elements.userEmail.textContent = user.email;
  }
};

const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    showNotif(`Error signing out: ${error.message}`, failedSvg);
    return;
  }

  window.location.href = "auth.html";
};

//THEME
const applyTheme = (theme) => {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark_mode", isDark);

  elements.darkModeButton.style.display = isDark ? "none" : "block";
  elements.lightModeButton.style.display = isDark ? "block" : "none";

  elements.selectedPage.style.backgroundColor =
    isDark ? "rgb(76, 75, 75)" : "rgb(240, 238, 238)";
};

const initializeTheme = () => {
  const theme = localStorage.getItem("theme") || "light";

  applyTheme(theme);

  elements.darkModeButton.addEventListener("click", () => {
    localStorage.setItem("theme", "dark");
    applyTheme("dark");
  });

  elements.lightModeButton.addEventListener("click", () => {
    localStorage.setItem("theme", "light");
    applyTheme("light");
  });
};

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const startNewDay = async (today) => {
  const { data, error } = await supabase
    .from("business_days")
    .insert({
      date_label: today,
      is_active: true,
      open_time: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error starting business day:", error);
    throw error;
  }

  activeDayId = data.id;

  showNotif("New business day started", infoSvg);

  return activeDayId;
};

const reactivateBusinessDay = async (dayId) => {
  const { error } = await supabase
    .from("business_days")
    .update({
      is_active: true,
      open_time: new Date().toISOString(),
      close_time: null,
    })
    .eq("id", dayId);

  if (error) {
    console.error("Error reactivating business day:", error);
    throw error;
  }

  activeDayId = dayId;

  showNotif("Business day reopened", infoSvg);

  return activeDayId;
};

const closeDay = async (dayId) => {
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select(
      `
      quantity,
      items (
        price
      )
    `,
    )
    .eq("business_day_id", dayId);

  if (salesError) {
    console.error("Error fetching sales before closing day:", salesError);
    throw salesError;
  }

  const totalRevenue = sales.reduce((sum, sale) => {
    return sum + sale.quantity * sale.items.price;
  }, 0);

  const totalItems = sales.reduce((sum, sale) => {
    return sum + sale.quantity;
  }, 0);

  const { error: summaryError } = await supabase.from("daily_summary").insert({
    business_day_id: dayId,
    date: getToday(),
    total_revenue: totalRevenue,
    total_items_sold: totalItems,
  });

  if (summaryError) {
    console.error("Error saving daily summary:", summaryError);
    throw summaryError;
  }

  const { error: closeError } = await supabase
    .from("business_days")
    .update({
      is_active: false,
      close_time: new Date().toISOString(),
    })
    .eq("id", dayId);

  if (closeError) {
    console.error("Error closing business day:", closeError);
    throw closeError;
  }
};

const checkOrCreateBusinessDay = async () => {
  const today = getToday();

  const { data: lastDay, error } = await supabase
    .from("business_days")
    .select("id, date_label, is_active")
    .order("open_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching business day:", error);
    throw error;
  }

  if (!lastDay) {
    return startNewDay(today);
  }

  const isToday = lastDay.date_label === today;

  if (isToday && lastDay.is_active) {
    activeDayId = lastDay.id;

    return activeDayId;
  }

  if (isToday && !lastDay.is_active) {
    return reactivateBusinessDay(lastDay.id);
  }

  if (!isToday && lastDay.is_active) {
    await closeDay(lastDay.id);
  }

  return startNewDay(today);
};

const fetchSales = async () => {
  if (!activeDayId) {
    activeDayId = await checkOrCreateBusinessDay();
  }

  const { data, error } = await supabase
    .from("sales")
    .select(
      `
      id,
      quantity,
      items (
        name,
        price
      )
    `,
    )
    .eq("business_day_id", activeDayId);

  if (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }

  return data ?? [];
};

const calculateTotalRevenue = (sales) => {
  return sales.reduce((total, sale) => {
    return total + sale.quantity * sale.items.price;
  }, 0);
};

const createSaleRow = (sale) => {
  const row = document.createElement("tr");

  const itemName = capitalize(sale.items.name);
  const revenue = sale.quantity * sale.items.price;

  row.innerHTML = `
    <td>${itemName}</td>

    <td class="align-center quantity">
      <span class="quantity-badge">
        ${sale.quantity}
      </span>
    </td>

    <td class="align-right revenue">
      <span class="revenue-number">
        ${revenue}
      </span>

      <span class="currency">
        MAD
      </span>
    </td>

    <td class="center-content">
      <button
        type="button"
        class="delete-row-btn"
        data-id="${sale.id}"
        data-name="${itemName}"
        title="Remove Sale"
        aria-label="Remove ${itemName} sale"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </td>
  `;

  return row;
};

const renderSales = (sales) => {
  elements.tableBody.innerHTML = "";
  salesTable.style.display = "none";
  if (!sales.length) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td colspan="4" class="noItemsFeedback">
        No sales tracked for today
      </td>
    `;

    elements.tableBody.append(row);
    elements.totalRevenueDisplay.textContent = "0 MAD";

    return;
  }

  const fragment = document.createDocumentFragment();

  sales.forEach((sale) => {
    fragment.prepend(createSaleRow(sale));
  });

  elements.tableBody.append(fragment);

  const totalRevenue = calculateTotalRevenue(sales);

  elements.totalRevenueDisplay.textContent = `${totalRevenue} MAD`;
};

const fetchSalesSummary = async () => {
  try {
    const sales = await fetchSales();

    renderSales(sales);
  } catch (error) {
    console.error("Error loading sales summary:", error);

    showNotif(
      "An error occurred while loading sales. Please refresh the page.",
      failedSvg,
    );
  }
};

const deleteSale = async (saleId) => {
  try {
    const user = await getUser();

    if (!user) {
      throw new Error("Could not find the current user.");
    }

    if (!activeDayId) {
      activeDayId = await checkOrCreateBusinessDay();
    }

    const { data, error } = await supabase
      .from("sales")
      .delete()
      .eq("id", saleId)
      .select("id");

    if (error) {
      throw error;
    }

    if (!data?.length) {
      throw new Error(
        "No matching sale was deleted. Check the sale ID or database permissions.",
      );
    }

    showNotif("Sale deleted", successSvg);

    await fetchSalesSummary();
  } catch (error) {
    console.error("Error deleting sale:", error);

    showNotif(`Error deleting sale: ${error.message}`, failedSvg);
  }
};

const subscribeToSalesUpdates = () => {
  return supabase
    .channel("sales_updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sales",
      },
      async (payload) => {
        console.log("Sales update:", payload.eventType);

        await fetchSalesSummary();
      },
    )
    .subscribe();
};

const initializeProfileEvents = () => {
  elements.profileIcon.addEventListener("click", () => {
    elements.profileCard.classList.toggle("show");
  });

  elements.closeProfileCard.addEventListener("click", () => {
    elements.profileCard.classList.remove("show");
  });
};

const initializeLogoutEvents = () => {
  elements.logOutButton.addEventListener("click", () => {
    elements.overlay.style.display = "block";
    elements.logOutModal.style.display = "flex";
  });

  elements.cancelLogOut.addEventListener("click", () => {
    elements.overlay.style.display = "none";
    elements.logOutModal.style.display = "none";
  });

  elements.confirmLogOut.addEventListener("click", signOut);
};

const initializeSalesEvents = () => {
  elements.tableBody.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-row-btn");

    if (!deleteButton) {
      return;
    }

    const saleId = deleteButton.dataset.id;

    if (!saleId) {
      console.warn("Sale button has no data-id");
      return;
    }

    deleteButton.disabled = true;
    console.log(saleId);
    await deleteSale(saleId);

    deleteButton.disabled = false;
  });
};

const initializeApp = async () => {
  try {
    const authenticated = await checkAuth();

    if (!authenticated) {
      return;
    }

    initializeTheme();
    initializeProfileEvents();
    initializeLogoutEvents();
    initializeSalesEvents();

    await displayUserEmail();

    activeDayId = await checkOrCreateBusinessDay();

    await fetchSalesSummary();

    subscribeToSalesUpdates();
  } catch (error) {
    console.error("Application initialization failed:", error);

    showNotif("Something went wrong while loading the dashboard.", failedSvg);
  }
};

document.addEventListener("DOMContentLoaded", initializeApp);
