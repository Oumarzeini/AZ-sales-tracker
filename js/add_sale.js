import { supabase } from "./config.js";

// GLOBAL VARIABLES
const addSaleBtn = document.getElementById("addSaleBtn");
const selectMenu = document.getElementById("menuItems");
const incrementBtn = document.getElementById("increment_btn");
const decrementBtn = document.getElementById("decrement_btn");
let quantityInput = document.getElementById("quantity_input");
const newItemBtn = document.getElementById("newItem");
const cancelBtn = document.getElementById("cancelBtn");
const overlay = document.getElementById("overlay");
const newItemBox = document.getElementById("newItemBox");
const body = document.body;
const newItemForm = document.getElementById("newItemForm");
let currentBusinessDayId = null;

// SVG'S
const successSvg = `<svg
        height="25"
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

// DATE DISPLAY
const date = new Date().toDateString();
document.getElementById("dateDisplay").textContent = date;

// QUANTITY INPUT HANDLING
decrementBtn.onclick = () => {
  if (quantityInput.value >= 2) {
    quantityInput.value--;
  } else {
    return;
  }
};

incrementBtn.onclick = () => {
  quantityInput.value++;
};

// DISPLAY HANDLING

document.getElementById("dark_mode").onclick = () => {
  document.getElementById("dark_mode").style.display = "none";
  document.getElementById("light_mode").style.display = "block";
  document.body.classList.add("dark_mode");
  document.getElementById("selected_page").style.backgroundColor =
    "rgb(76, 75, 75)";
};

document.getElementById("light_mode").onclick = () => {
  document.getElementById("light_mode").style.display = "none";
  document.getElementById("dark_mode").style.display = "block";
  document.body.classList.remove("dark_mode");
  document.getElementById("selected_page").style.backgroundColor =
    "rgb(240, 238, 238)";
};

// DOM AND DATA FUNCTIONS
const choices = new Choices(selectMenu, {
  placeholder: true,
  placeholderValue: "Select an item",
  searchEnabled: true,
  searchPlaceholderValue: "search items...",
  shouldSort: false,
});

const fetchItems = async () => {
  const { data: items, error } = await supabase
    .from("items")
    .select("id, name");
  if (error) {
    console.log(error);
    showNotif("Error fetching data, please refresh the page.", failedSvg);
    return;
  }

  choices.clearChoices();
  choices.setChoices([
    {
      value: "",
      label: "Select an item",
      selected: true,
      disabled: true,
    },

    ...items.map(
      (item) => ({
        value: item.id,
        label: item.name,
        selected: false,
      }),
      "value",
      "label",
      false
    ),
  ]);
};

fetchItems();

addSaleBtn.onclick = () => {
  addSale();
};

const startNewDay = async (today) => {
  const { data, error } = await supabase
    .from("business_days")
    .insert([{ date_label: today }])
    .select("id");

  if (error) {
    console.warn("Error starting new business day ");
    showNotif("An error occured, Please refresh the page.", failedSvg);
    return;
  }

  currentBusinessDayId = data[0].id;
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

const addSale = async () => {
  const itemId = selectMenu.value;
  const quantity = parseInt(document.getElementById("quantity_input").value);

  if (!itemId || !quantity || quantity < 0) {
    console.log("please select an item and a quantity");
    showNotif("please select an item and a quantity", infoSvg);
    return;
  }

  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select("price")
    .eq("id", itemId)
    .single();

  if (itemErr) {
    showNotif("An error occured, Please refresh the page.", failedSvg);
  }
  const total = item.price * quantity;

  const { data, error } = await supabase.from("sales").insert([
    {
      item_id: itemId,
      quantity,
      total,
      business_day_id: currentBusinessDayId,
    },
  ]);

  if (error) {
    console.log(error.message);
    showNotif("An error occured, Please refresh the page.", failedSvg);
  } else {
    showNotif("Sale Added Successfully.", successSvg);
    setTimeout(() => {
      choices.removeActiveItems();
      document.getElementById("quantity_input").value = 1;
    }, 100);
  }
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

newItemBtn.onclick = async () => {
  overlay.style.display = "block";
  newItemBox.style.display = "flex";
  body.style.overflow = "hidden";
};

cancelBtn.onclick = () => {
  overlay.style.display = "none";
  newItemBox.style.display = "none";
  body.style.overflow = "auto";
};

newItemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const itemName = document
    .getElementById("itemName")
    .value.trim()
    .toLowerCase();
  const itemPrice = document.getElementById("itemPrice").value.trim();

  if (
    !itemName ||
    !itemPrice ||
    document.getElementById("itemPrice").value < 1
  ) {
    showNotif(
      "Please add item name and a price that's not lower than 1",
      infoSvg
    );
    document.getElementById("itemName").value = "";
    document.getElementById("itemPrice").value = "";
    return;
  }

  await insertNewItem(itemName, itemPrice);
  overlay.style.display = "none";
  newItemBox.style.display = "none";
  body.style.overflow = "auto";

  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
});

const insertNewItem = async (item, price) => {
  const { data: sale, error } = await supabase
    .from("items")
    .insert([{ name: item, price: price }]);
  if (error) {
    if (error.message.includes("duplicate key")) {
      showNotif("Can't add existing items", failedSvg);
      return;
    }
    console.log("Error inserting manually ", error.message);
    showNotif("An Error occured! , Please try again.", failedSvg);
    return;
  } else {
    showNotif("Item added Successfully!", successSvg);
  }
};

const subscribeToItemsUpdate = () => {
  const channel = supabase
    .channel("items_updates")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "items" },
      (payload) => {
        fetchItems();
      }
    )
    .subscribe();
};

document.addEventListener("DOMContentLoaded", async () => {
  await checkOrCreateBusinessDay();
  subscribeToItemsUpdate();
});
