const formatDate = () => {
  const date = new Date().toDateString();

  const day =
    date.startsWith("Mo") ? "Monday"
    : date.startsWith("Tu") ? "Tuesday"
    : date.startsWith("We") ? "Wednsday"
    : date.startsWith("Thu") ? "Thursday"
    : date.startsWith("Fr") ? "Friday"
    : date.startsWith("Sa") ? "Saturday"
    : "Sunday";

  const rest = new Date().toLocaleDateString().replaceAll("/", "-");

  return day + " " + rest;
};

export default formatDate;
