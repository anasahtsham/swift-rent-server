import morgan from "morgan";
import { OFFSET } from "../constants/constants.js";

morgan.token("timestamp", function (req, res) {
  const date = new Date(Date.now() + OFFSET); // Create Date with offset
  const formattedDate =
    "DATE: " +
    date.toISOString().slice(0, 19).replace("T", " / TIME: ") +
    " / REQUEST: ";
  return formattedDate;
});

export default morgan;
