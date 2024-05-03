import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "./src/helpers/loggerhelper.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import applyRoutes from "./src/routes/index.js";
import path from "path";

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
app.use(
  "/landing-page",
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "public")
  )
);

// Default route FOR DISABLING THE LANDING PAGE
app.use(
  "/landing-page",
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "public")
  )
);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
