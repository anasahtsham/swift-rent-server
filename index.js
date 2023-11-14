import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("tiny"));

app.get("/", (req, res) => {
    res.send("get req");
})

app.post("/submit", (req, res, next) => {
    console.log(req.body);
    res.send("post");
    next();
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})