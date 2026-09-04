import supabase from "./config.js";
const signingForm = document.getElementById("signingForm");
const header = document.getElementById("header");
const switchOption = document.getElementById("switchOption");
const formFeedbackContainer = document.getElementById(
  "form-feedback-container",
);
const text = document.getElementById("form-feedback-text");

const successBG = "#caffc4";
const successColor = "#076d08";
const errorBG = "#ffdddd";
const errorColor = "#920a0a";

const showFormFeedback = (bg, color, message) => {
  formFeedbackContainer.style.display = "flex";
  formFeedbackContainer.style.backgroundColor = bg;
  formFeedbackContainer.style.color = color;
  text.textContent = message;
};

const fomrInputs = document.querySelectorAll(".form-input");

fomrInputs.forEach((input) =>
  input.addEventListener("input", () => {
    formFeedbackContainer.style.display = "none";
    formFeedbackContainer.style.backgroundColor = "";
    formFeedbackContainer.style.color = "";
    text.textContent = "";
  }),
);

const signUp = async (email, password, name) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (email === "" || password === "" || name === "" || !regex.test(email)) {
    showNotif(
      "Please enter a Name, a valid Email, and a Password",
      "failed-icon",
    );
    showFormFeedback(
      errorBG,
      errorColor,
      "Please enter a Name, a valid Email, and a Password",
    );
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        business_name: name,
      },
    },
  });

  if (error) {
    showNotif(error, "failed-icon");
    showFormFeedback(errorBG, errorColor, error.message);
    console.log(error);
    return;
  } else {
    showNotif(
      "Almost done. Please check your email inbox for a verification link.",
      "success",
    );
    showFormFeedback(
      successBG,
      successColor,
      "Almost done. Please check your email inbox for a verification link.",
    );
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("name").value = "";
  }
};

const signIn = async (email, password) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (email === "" || password === "" || !regex.test(email)) {
    showNotif("Please enter a valid Email and a Password", "failed-icon");
    showFormFeedback(
      errorBG,
      errorColor,
      "Please enter a valid Email and a Password",
    );
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showNotif(error.message, "failed-icon");
    showFormFeedback(errorBG, errorColor, error.message);
    return;
  } else {
    window.location.href = "home.html";
  }
};

switchOption.onclick = () => {
  if (header.textContent === "Sign Up") {
    header.textContent = "Sign In";
    document.querySelector(".name-container").style.display = "none";
    switchOption.textContent = "Sign Up ";
  } else {
    header.textContent = "Sign Up";
    document.querySelector(".name-container").style.display = "inline-flex";
    switchOption.textContent = "Sign In ";
  }
};

signingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const name = document.getElementById("name").value.trim();

  header.textContent === "Sign Up" ?
    signUp(email, password, name)
  : signIn(email, password);
});

const showNotif = (text, icon) => {
  const notifContainer = document.getElementById("notifContainer");
  const progressBar = document.getElementById("progress_bar");

  const notifText = document.getElementById("notifText");
  notifText.textContent = text;

  if (icon === "failed-icon") {
    document.querySelector(".failed-icon").style.display = "block";

    document.querySelector(".success-icon").style.display = "none";
  } else {
    document.querySelector(".success-icon").style.display = "block";

    document.querySelector(".failed-icon").style.display = "none";
  }

  notifContainer.classList.add("show_notif");
  setTimeout(() => {
    progressBar.classList.add("move");
  }, 100);

  setTimeout(() => {
    notifContainer.classList.remove("show_notif");
    progressBar.classList.remove("move");
    document.querySelector(".failed-icon").style.display = "none";
    document.querySelector(".success-icon").style.display = "none";
  }, 5000);
};
