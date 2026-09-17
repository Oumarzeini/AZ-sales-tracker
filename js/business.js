import getUser from "./utils/getUser.js";
import supabase from "./config.js";
import products from "./sample-products.js";

let currentBusinessDayId;
let currentUserEmail;

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

  changeNameButton: document.getElementById("change-name-btn change-name-btn"),
  updateProductButton: document.getElementById("update-product-btn"),
  addNewProductButtonLarge: document.getElementById(
    "add-new-product-btn-large",
  ),
  addNewProductButtonSmall: document.getElementById(
    "add-new-product-btn-small",
  ),
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

//auth

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
    currentUserEmail = user.email;
  }
  return user.email;
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

const changeBusinessName = async (name) => {
  const saveBtn = document.getElementById("save-business-name-btn");
  try {
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.5";

    const user = await getUser();

    if (!user) throw new Error("Couldn't Get User!");

    const { error } = await supabase
      .from("businesses")
      .update({ name })
      .eq("owner_id", user.id);

    if (error) {
      throw error;
    }

    saveBtn.textContent = "Save";
    saveBtn.disabled = false;
    saveBtn.style.opacity = "1";
    document.getElementById("change-name-model").style.display = "none";
    elements.overlay.style.display = "none";
    getBusinessName();
    showNotif("Business Name Changed", successSvg);
  } catch (err) {
    console.lo("Error changing business name: ", err.message || err);

    showNotif(
      `Error changing business name : ${err.message || err} `,
      failedSvg,
    );

    saveBtn.textContent = "Save";
    saveBtn.disabled = false;
    saveBtn.style.opacity = "1";
  }
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

    const abbr = shortName(name[0].name);
    const businessName = abbr;

    document.getElementById("business-default-avatar").textContent = abbr;

    elements.displayName.textContent = name[0].name;
    document
      .querySelectorAll(".business-name")
      .forEach((el) => (el.textContent = name[0].name));

    elements.profileIcon.innerHTML = `<span>${businessName}</span>`;
    elements.bottomProfileIcon.innerHTML = `<span>${businessName}</span>`;

    currentUserEmail = await displayUserEmail();

    document.getElementById("profile-right-container").innerHTML = `
       <p>
                  <span class="business-name">${name[0].name} </span>
                  <span id="change-name-btn">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-square-pen"
                    >
                      <path
                        d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      />
                      <path
                        d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
                      />
                    </svg>
                  </span>
                </p>
                <p class="products-count business-email">${currentUserEmail}</p>
    `;
  } catch (err) {
    console.log("Error getting user", err);
  }
};

getBusinessName();

const addNewProduct = async (name, price, cost) => {
  const addBtn = document.getElementById("add-new-product-btn");
  try {
    addBtn.textContent = "Adding...";
    addBtn.disabled = true;
    addBtn.style.opacity = "0.5";

    const user = await getUser();

    if (!user) {
      throw new Error("Couldn't get user");
    }

    const { error } = await supabase
      .from("items")
      .insert([{ name, price, cost, user_email: user.email }])
      .eq("user_id", user.id);

    if (error) {
      if (error.message.includes("duplicate key")) {
        throw new Error("This product exists already.");
      }

      throw error;
    }

    showNotif("Product Added.", successSvg);
    addBtn.textContent = "Add Product";
    addBtn.disabled = false;
    addBtn.style.opacity = "1";
  } catch (err) {
    console.log("Error Adding new Product: ", err.message || err);
    showNotif(`Error Adding New Product: ${err.message || err} `, failedSvg);
    addBtn.textContent = "Add Product";
    addBtn.disabled = false;
    addBtn.style.opacity = "1";
  }
};

const handleModels = async () => {
  const changeNameModel = document.getElementById("change-name-model");
  const updateProductModel = document.getElementById("update-product-model");
  const deleteProductPopup = document.getElementById("delete-popup");
  const newProductModel = document.getElementById("new-product-model");

  //Name change logic
  await getBusinessName();
  document.getElementById("change-name-btn").onclick = () => {
    elements.overlay.style.display = "block";
    changeNameModel.style.display = "flex";
  };

  changeNameModel.querySelector(".cancel-btn").onclick = () => {
    elements.overlay.style.display = "none";
    changeNameModel.style.display = "none";
  };

  changeNameModel.querySelector(".change-name-form").onsubmit = async (e) => {
    e.preventDefault();

    const name = changeNameModel
      .querySelector("#new-business-name")
      .value.trim();

    await changeBusinessName(name);
  };

  //update product logic

  //add new product logic
  document.querySelectorAll(".add-new-product").forEach(
    (el) =>
      (el.onclick = () => {
        overlay.style.display = "flex";
        newProductModel.style.display = "flex";
      }),
  );

  newProductModel.querySelector(".cancel_btn").onclick = () => {
    elements.overlay.style.display = "none";
    newProductModel.style.display = "none";
  };

  newProductModel.querySelector("#new-product-form").onsubmit = async (e) => {
    e.preventDefault();

    const name = newProductModel.querySelector("#product-name").value.trim();
    const price = newProductModel.querySelector("#product-price").value.trim();
    const cost = newProductModel.querySelector("#product-cost").value.trim();

    if (!name || !price || !cost) return;

    await addNewProduct(name, price, cost);

    newProductModel.querySelector("#product-name").value = "";
    newProductModel.querySelector("#product-price").value = "";
    newProductModel.querySelector("#product-cost").value = "";

    elements.overlay.style.display = "none";
    newProductModel.style.display = "none";
  };
};

handleModels();

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

const renderProducts = async (query = "") => {
  document.getElementById("products-wrapper").innerHTML = "";
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  );

  // const user = await getUser();

  // if (!user) return;

  // const { data: userProducts, error } = await supabase
  //   .from("items")
  //   .select("item_id, name, price, cost")
  //   .eq("user_id", user.id);

  // console.log(userProducts);

  try {
    filteredProducts.map((product) => {
      const productContainer = document.createElement("div");
      productContainer.className = "product-container";

      productContainer.innerHTML = `
      <p class="product-name"> <span>${product.name}</span>  </p>
      <p class="product-price">Price : ${product.price} <span class="price-mad">MAD</span> </p>
        <p class="product-cost">Cost : ${product.cost} <span class="cost-mad">MAD</span> </p>
      `;

      const actionsContainer = document.createElement("div");
      actionsContainer.className = "actions-container";

      actionsContainer.innerHTML = `
      <button><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-square-pen"
                >
                  <path
                    d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  />
                  <path
                    d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
                  /></svg> </button>
         
 <button> <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
        </svg> </button>
                 
      `;

      productContainer.append(actionsContainer);
      document.getElementById("products-wrapper").prepend(productContainer);
    });
  } catch (err) {
    console.log("Error rendering products", err);
  }
};

renderProducts();

const handleSearch = () => {
  const searchForm = document.getElementById("search-products-form");
  const searchInput = document.getElementById("search-input");

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    renderProducts(searchInput.value);
  });
};

handleSearch();

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
