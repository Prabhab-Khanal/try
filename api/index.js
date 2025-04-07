const express = require("express");
const serverless = require("serverless-http");
const path = require("path");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/debug-pkg', (req, res) => {
    const pkg = require('./package.json');
    res.send(pkg.dependencies);
  });
  
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public/views"));
app.use(express.static(path.join(__dirname, "../public")));

// Load routes
const projectRoutes = require("../modules/projectRoutes"); // ✅ change if needed
app.use("/", projectRoutes);

module.exports = serverless(app);
