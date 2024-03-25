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
app.use(morgan("tiny"));

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
