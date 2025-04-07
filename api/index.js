const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const { Project, Sector, sequelize } = require("../models/projects");
const projectData = require("../modules/projects");
require("dotenv").config();

const app = express();
const router = express.Router();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public/views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Initialize database and services
projectData.initialize().catch(err => console.error("Initialization failed:", err));

// ---------------- ROUTES ---------------- //

// Home
router.get("/", async (req, res) => {
  try {
    const projects = await projectData.getAllProjects();
    res.render("index", { projects });
  } catch {
    res.render("index", { projects: [] });
  }
});

// About
router.get("/about", (req, res) => {
  res.render("about");
});

// All Projects
router.get("/solutions/projects", async (req, res) => {
  const sector = req.query.sector;
  try {
    let projects;
    const sectors = await projectData.getAllProjects(); // this might be getAllSectors() if you're fetching sector list

    if (sector) {
      projects = await projectData.getProjectsBySector(sector);
    } else {
      projects = await projectData.getAllProjects();
    }

    res.render("projects", { projects, sector, sectorData: sectors });
  } catch {
    res.render("projects", { projects: [], sector, sectorData: [] });
  }
});

// Individual Project
router.get("/solutions/projects/:id", async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    const project = await projectData.getProjectById(projectId);
    res.render("project", { project });
  } catch {
    res.status(404).render("error");
  }
});

// Add Project (GET)
router.get("/solutions/addProject", async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    res.render("addProject", { sectors });
  } catch {
    res.render("error");
  }
});

// Add Project (POST)
router.post("/solutions/addProject", async (req, res) => {
  try {
    const newProject = await Project.create(req.body);
    res.redirect(`/solutions/projects/${newProject.id}`);
  } catch {
    res.status(500).send("Error adding project.");
  }
});

// Delete Project
router.post("/solutions/projects/:id/delete", async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) return res.status(404).send("Not found");

  await project.destroy();
  res.redirect("/solutions/projects");
});

// Edit Project (GET)
router.get("/solutions/projects/:id/edit", async (req, res) => {
  try {
    const project = await projectData.getProjectById(req.params.id);
    const sectors = await projectData.getAllSectors();
    res.render("editProject", { project, sectors });
  } catch {
    res.status(404).render("error");
  }
});

// Edit Project (POST)
router.post("/solutions/projects/:id/edit", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).send("Not found");

    await project.update(req.body);
    res.redirect(`/solutions/projects/${project.id}`);
  } catch {
    res.status(500).send("Error updating project.");
  }
});

// 404 fallback
router.use((req, res) => {
  res.status(404).render("error");
});

app.use("/", router);

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
