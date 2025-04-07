// •	Add the following declaration at the top of your server.js file:
/********************************************************************************
 *  WEB322 – Assignment 05
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Sarbesh Khadka Student ID: 188383236 Date: 2025/03/25
 *
 *  Published URL: ___________________________________________________________
 *
 ********************************************************************************/

// server.js
const { Project, Sector, sequelize } = require("./models/projects"); // Import Project and Sector models
const express = require("express");
const path = require("path");
const projectData = require("./modules/projects"); // Correctly handling both Project and Sector
// const { Sector } = require("./models/projects");  // Alternatively, import Sector directly if needed
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Initialize project data
projectData
  .initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Initialization failed:", err);
  });

// Routes

// Home Page
app.get("/", async (req, res) => {
  try {
    const projects = await projectData.getAllProjects();
    res.render("index", { projects });
  } catch (err) {
    res.render("index", { projects: [] });
  }
});

// About Page
app.get("/about", (req, res) => {
  res.render("about");
});

// Projects List (Filter by sector if present)
app.get("/solutions/projects", async (req, res) => {
  const sector = req.query.sector; // Get the sector parameter from the query string
  try {
    let projects;
    const sectors = await projectData.getAllProjects(); // Use projectData to get sector data

    if (sector) {
      // Get projects filtered by the sector
      projects = await projectData.getProjectsBySector(sector);
    } else {
      // If no sector is provided, get all projects
      projects = await projectData.getAllProjects();
    }

    // Pass sectorData to the view
    res.render("projects", { projects, sector, sectorData: sectors });
  } catch (err) {
    console.error(err);
    res.render("projects", { projects: [], sector, sectorData: [] });
  }
});

// Individual Project Page
app.get("/solutions/projects/:id", async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    const project = await projectData.getProjectById(projectId);
    res.render("project", { project });
  } catch (err) {
    res.status(404).render("error");
  }
});

// Route to display the "Add Project" page (GET request)
app.get("/solutions/addProject", async (req, res) => {
  try {
    // Fetch all sectors to populate the select dropdown
    const sectors = await projectData.getAllSectors(); // You need to implement getAllSectors
    res.render("addProject", { sectors });
  } catch (err) {
    console.error("Error fetching sectors:", err);
    res.render("error");
  }
});

// Route to handle project submission (POST request)
// Add Project Route
app.post("/solutions/addProject", async (req, res) => {
  const {
    title,
    feature_img_url,
    sector_id,
    intro_short,
    summary_short,
    impact,
    original_source_url,
  } = req.body;

  try {
    // Create a new project
    const newProject = await Project.create({
      title,
      feature_img_url,
      sector_id,
      intro_short,
      summary_short,
      impact,
      original_source_url,
    });

    // Redirect to the project details page after adding
    res.redirect(`/solutions/projects/${newProject.id}`);
  } catch (err) {
    console.error("Error adding project:", err);
    res.status(500).send("Error adding project.");
  }
});
// Route to delete a project
// Route to delete a project
app.post("/solutions/projects/:id/delete", async (req, res) => {
  const projectId = req.params.id;

  try {
    // Find the project by ID
    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).send("Project not found");
    }

    // Delete the project
    await project.destroy();

    // Redirect to the projects list page
    res.redirect("/solutions/projects");
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).send("Error deleting project");
  }
});

// Route to display the Edit Project page
app.get("/solutions/projects/:id/edit", async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    const project = await projectData.getProjectById(projectId);
    const sectors = await projectData.getAllSectors(); // Get all sectors for the select dropdown
    res.render("editProject", { project, sectors }); // Render editProject page
  } catch (err) {
    res.status(404).render("error");
  }
});
// Route to handle project update (POST request)
app.post("/solutions/projects/:id/edit", async (req, res) => {
  const projectId = parseInt(req.params.id);
  const {
    title,
    feature_img_url,
    sector_id,
    intro_short,
    summary_short,
    impact,
    original_source_url,
  } = req.body;

  try {
    // Find and update the project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).send("Project not found");
    }

    project.title = title;
    project.feature_img_url = feature_img_url;
    project.sector_id = sector_id;
    project.intro_short = intro_short;
    project.summary_short = summary_short;
    project.impact = impact;
    project.original_source_url = original_source_url;

    // Save the updated project
    await project.save();

    // Redirect to the updated project page
    res.redirect(`/solutions/projects/${project.id}`);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).send("Error updating project.");
  }
});

// 404 Page
app.use((req, res) => {
  res.status(404).render("error");
});
