const incrementBtn = document.getElementById("increment_btn");
const decrementBtn = document.getElementById("decrement_btn");
let quantityInput = document.getElementById("quantity_input");

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

new Choices("#menuItems", {
  searchEnabled: true,
  searchPlaceholderValue: "search items...",
});
