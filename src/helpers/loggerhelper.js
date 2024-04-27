import morgan from "morgan";

morgan.token("timestamp", function (req, res) {
  const offset = 5 * 60 * 60 * 1000; // Adjusting for timezone (+5 GMT ISB/KHI)
  const date = new Date(Date.now() + offset); // Create Date with offset
  const formattedDate =
    "DATE: " +
    date.toISOString().slice(0, 19).replace("T", " / TIME: ") +
    " / REQUEST: ";
  return formattedDate;
});

export default morgan;
