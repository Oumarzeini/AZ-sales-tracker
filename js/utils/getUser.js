import supabase from "../config.js";

const getUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.log("error getting user: ", error.message);
    return null;
  }

  return user;
};

export default getUser;
