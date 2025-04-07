const { Project, Sector, sequelize } = require("../models/projects");
const express = require("express");
const path = require("path");
const projectData = require("../modules/projects");
require("dotenv").config();

const app = express();

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public/views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/solutions/projects", async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    const projects = await projectData.getAllProjects();
    res.render("projects", { projects, sectors });
  } catch (err) {
    res.status(500).send("Error loading projects");
  }
});

// Vercel entry point
let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    try {
      await projectData.initialize();
      initialized = true;
    } catch (err) {
      return res.status(500).send("Failed to initialize project data");
    }
  }

  return app(req, res); // Pass request to Express app
};
