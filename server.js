import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Import routes
import adminRouter from "./src/routes/adminRoutes.js";
import authRouter from "./src/routes/authRoutes.js";
import managerRouter from "./src/routes/managerRoutes.js";
import tenantRouter from "./src/routes/tenantRoutes.js";
import ownerRouter from "./src/routes/ownerRoutes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);

const app = express();
app.use(cors());
const port = 3000;

// JSON Parser
app.use(express.json());

// Parser
app.use(bodyParser.urlencoded({ extended: true }));

// Request Logger
morgan.token("timestamp", function (req, res) {
  const offset = 5 * 60 * 60 * 1000; // Adjusting for timezone (+5 GMT ISB/KHI)
  const date = new Date(Date.now() + offset); // Create Date with offset
  const formattedDate =
    "DATE: " +
    date.toISOString().slice(0, 19).replace("T", " / TIME: ") +
    " / REQUEST: ";
  return formattedDate;
});

app.use(
  morgan(
    ":timestamp :method :url :status :res[content-length] - :response-time ms"
  )
);

// Use routes
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/manager", managerRouter);
app.use("/api/tenant", tenantRouter);
app.use("/api/owner", ownerRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
