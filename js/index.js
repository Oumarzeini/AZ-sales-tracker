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

const signingForm = document.getElementById("signingForm");
const header = document.getElementById("header");
const switchOption = document.getElementById("switchOption");
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

const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    showNotif(error.message, failedSvg);
  } else {
    showNotif("Please check your email for a verification link.", infoSvg);
  }
};

const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showNotif(error.message, failedSvg);
  } else {
    window.location.href = "home.html";
  }
};

switchOption.onclick = () => {
  if (header.textContent === "Sign Up") {
    header.textContent = "Sign In";
    switchOption.textContent = "Sign Up ?";
  } else {
    header.textContent = "Sign Up";
    switchOption.textContent = "Sign In ?";
  }
};

signingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  header.textContent === "Sign Up"
    ? signUp(email, password)
    : signIn(email, password);
});

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