import getUser from "./utils/getUser.js";
import supabase from "./config.js";
import products from "./sample-products.js";

let currentBusinessDayId;

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

const elements = {
  overlay: document.getElementById("overlay"),
  logOutModal: document.getElementById("logOutModel"),
  cancelLogOut: document.getElementById("cancelLogOut"),
  confirmLogOut: document.getElementById("confirmLogOut"),

  profileIcon: document.getElementById("profileIcon"),
  bottomProfileIcon: document.getElementById("bottom-profile-icon"),
  profileCard: document.getElementById("profileCard"),
  closeProfileCard: document.getElementById("closeProfileCard"),

  displayName: document.getElementById("business-name"),
  productsCount: document.getElementById("products-count"),
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

//check if user is authenticated

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
      }, 2000);
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
const shortName = (name) => {
  const arr = name.split(" ");
  if (arr.length > 1) {
    return arr[0][0].toUpperCase() + arr[1][0].toUpperCase();
  } else {
    return arr[0].split("")[0].toUpperCase();
  }
};

const getBusinessName = async () => {
  try {
    const user = await getUser();

    if (!user) return;

    const { data: name, error } = await supabase
      .from("businesses")
      .select("name")
      .eq("owner_id", user.id);

    const { data: products, error: productsErr } = await supabase
      .from("items")
      .select("id")
      .eq("user_id", user.id);

    if (error || productsErr) {
      throw error || productsErr;
    }

    elements.productsCount.textContent = `Total Products : ${products.length}`;
    const businessName = shortName(name[0].name);
    elements.displayName.textContent = name[0].name;
    document.querySelector(".business-name").textContent = name[0].name;
    elements.profileIcon.innerHTML = `<span>${businessName}</span>`;
    elements.bottomProfileIcon.innerHTML = `<span>${businessName}</span>`;
  } catch (err) {
    console.log("Error getting user", err);
  }
};

getBusinessName();

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

const setTotalSalesCount = async (activeDayId) => {
  try {
    const { data: sales, error } = await supabase
      .from("sales")
      .select("id")
      .eq("business_day_id", activeDayId);

    if (error) {
      throw error;
    }

    document.getElementById("total-sales-btn").textContent = ` ${sales.length}`;
  } catch (err) {
    console.log("couldn't get sales count", err);
    showNotif(
      "Couldn't get today sales count, Try refreshing the page." + err.message,
      failedSvg,
    );
  }
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
    currentBusinessDayId = day.id;
    return currentBusinessDayId;
  }

  if (dayDate !== today) {
    console.log("Closing old business day !");
    await closeDay(day.id);
    await startNewDay(today);
    return currentBusinessDayId;
  }

  if (dayDate === today && !day.is_active) {
    await startNewDay(today);
    return currentBusinessDayId;
  }
};

const renderProducts = () => {
  try {
    const productContainer = document.createElement("div");
    productContainer.className = "product-container";

    products.map((product) => {
      const productContainer = document.createElement("div");
      productContainer.className = "product-container";

      document.getElementById("products-wrapper").append(productContainer);
    });
  } catch (err) {}
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
    await checkOrCreateBusinessDay();
    await setTotalSalesCount(currentBusinessDayId);
    await displayUserEmail();
  } catch (error) {
    console.error("Application initialization failed:", error);

    showNotif(
      "Something went wrong while loading the page." + error,
      failedSvg,
    );
  }
};

document.addEventListener("DOMContentLoaded", initializeApp);
