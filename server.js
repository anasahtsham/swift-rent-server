import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "./src/helpers/loggerhelper.js";
import { fileURLToPath } from "url";
import applyRoutes from "./src/routes/index.js";
import path from "path";
import { logVisit } from "./src/helpers/websitelogger.js";
import { initializeTasks } from "./src/tasks/index.js";

const app = express();
app.use(cors());
const port = 3000;

// JSON Parser
app.use(express.json());

// Parser
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  morgan(
    ":timestamp :method :url :status :res[content-length] - :response-time ms"
  )
);

// Apply routes
applyRoutes(app);

//Send the ../public folder FOR HOSTING THE LANDING PAGE
app.use((req, res, next) => {
  if (req.url === "/" && req.method === "GET") {
    logVisit();
  }
  next();
});

app.use(
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "public")
  )
);

// Default route FOR DISABLING THE LANDING PAGE
// app.get("/", (req, res) => {
//   res.send("Welcome to the SwiftRent API Server! ");
// });

// Start the cron jobs
initializeTasks();

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
