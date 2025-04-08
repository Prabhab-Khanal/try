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

console.log("PG module installed:", !!require('pg'));

// Import necessary modules
const express = require("express");
const path = require("path");
const { Project, Sector, sequelize } = require("./models/projects"); // Import Project and Sector models
const projectData = require("./modules/projects");
const authData = require("./modules/auth-service"); 
const clientSessions = require("client-sessions");
require("dotenv").config();  // Ensure environment variables are loaded

const app = express();
const PORT = process.env.PORT || 8080;

// Set up EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session middleware setup
app.use(clientSessions({
  cookieName: "session",
  secret: process.env.SESSION_SECRET, // Secret key stored in .env
  duration: 2 * 60 * 1000, // Session duration in ms
  activeDuration: 1000 * 60, // Extend session by 1 minute on activity
}));

// Make session object available in all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Initialize project and authentication data
projectData.initialize()
  .then(() => {
    console.log("Project data initialized successfully.");
    return authData.initialize();
  })
  .then(() => {
    console.log("Authentication data initialized successfully.");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Unable to start server: ${err}`);
  });

// Middleware to ensure that a user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    console.log("Unauthorized access attempt. Redirecting to login.");
    return res.redirect("/login");
  }
  next();
}

// Routes

// Home Page
app.get("/", async (req, res) => {
  try {
    const projects = await projectData.getAllProjects();
    console.log("Successfully fetched all projects for home page.");
    res.render("index", { projects });
  } catch (err) {
    console.error("Error loading projects:", err);
    res.render("index", { projects: [] });
  }
});

// About Page
app.get("/about", (req, res) => {
  console.log("Navigating to About page.");
  res.render("about");
});

// Projects List (Filter by sector if present)
app.get("/solutions/projects", async (req, res) => {
  const sector = req.query.sector; // Get the sector parameter from the query string
  try {
    let projects;
    const sectors = await projectData.getAllSectors();

    if (sector) {
      projects = await projectData.getProjectsBySector(sector);
      console.log(`Fetched projects for sector: ${sector}`);
    } else {
      projects = await projectData.getAllProjects();
      console.log("Fetched all projects.");
    }

    res.render("projects", { projects, sector, sectorData: sectors });
  } catch (err) {
    console.error("Error loading projects:", err);
    res.render("projects", { projects: [], sector, sectorData: [] });
  }
});

// Individual Project Page
app.get("/solutions/projects/:id", async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    const project = await projectData.getProjectById(projectId);
    console.log(`Fetched project details for project ID: ${projectId}`);
    res.render("project", { project });
  } catch (err) {
    console.error("Error loading project:", err);
    res.status(404).render("error");
  }
});

// Route to display the "Add Project" page (GET request)
app.get("/solutions/addProject", ensureLogin, async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    console.log("Fetched sectors for add project page.");
    res.render("addProject", { sectors });
  } catch (err) {
    console.error("Error fetching sectors:", err);
    res.render("error");
  }
});

// Add Project Route (POST request)
app.post("/solutions/addProject", ensureLogin, async (req, res) => {
  const { title, feature_img_url, sector_id, intro_short, summary_short, impact, original_source_url } = req.body;

  try {
    const newProject = await Project.create({
      title,
      feature_img_url,
      sector_id,
      intro_short,
      summary_short,
      impact,
      original_source_url,
    });

    console.log(`New project added with ID: ${newProject.id}`);
    res.redirect(`/solutions/projects/${newProject.id}`);
  } catch (err) {
    console.error("Error adding project:", err);
    res.status(500).send("Error adding project.");
  }
});

// Delete a project
app.post("/solutions/projects/:id/delete", ensureLogin, async (req, res) => {
  const projectId = req.params.id;

  try {
    const project = await Project.findByPk(projectId);

    if (!project) {
      console.log(`Project with ID: ${projectId} not found.`);
      return res.status(404).send("Project not found");
    }

    await project.destroy();
    console.log(`Project with ID: ${projectId} deleted successfully.`);
    res.redirect("/solutions/projects");
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).send("Error deleting project");
  }
});

// Route to display the Edit Project page
app.get("/solutions/projects/:id/edit", ensureLogin, async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    const project = await projectData.getProjectById(projectId);
    const sectors = await projectData.getAllSectors();
    console.log(`Fetched project details for editing, ID: ${projectId}`);
    res.render("editProject", { project, sectors });
  } catch (err) {
    console.error("Error loading project for edit:", err);
    res.status(404).render("error");
  }
});

// Route to handle project update (POST request)
app.post("/solutions/projects/:id/edit", ensureLogin, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { title, feature_img_url, sector_id, intro_short, summary_short, impact, original_source_url } = req.body;

  try {
    const project = await Project.findByPk(projectId);
    if (!project) {
      console.log(`Project with ID: ${projectId} not found for update.`);
      return res.status(404).send("Project not found");
    }

    project.title = title;
    project.feature_img_url = feature_img_url;
    project.sector_id = sector_id;
    project.intro_short = intro_short;
    project.summary_short = summary_short;
    project.impact = impact;
    project.original_source_url = original_source_url;

    await project.save();
    console.log(`Project with ID: ${projectId} updated successfully.`);
    res.redirect(`/solutions/projects/${project.id}`);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).send("Error updating project.");
  }
});

// Show login form
app.get("/login", (req, res) => {
  console.log("Navigating to login page.");
  res.render("login", { errorMessage: "", userName: "" });
});

// Show register form
app.get("/register", (req, res) => {
  console.log("Navigating to register page.");
  res.render("register", { errorMessage: "", successMessage: "", userName: "" });
});

// Register logic
app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      console.log(`User registered successfully: ${req.body.userName}`);
      res.render("register", { successMessage: "User created", errorMessage: "", userName: "" });
    })
    .catch((err) => {
      console.error("Registration error:", err);
      res.render("register", { errorMessage: err, successMessage: "", userName: req.body.userName });
    });
});

// Login logic
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      console.log(`User logged in: ${user.userName}`);
      res.redirect("/solutions/projects");
    })
    .catch((err) => {
      console.error("Login error:", err);
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

// Logout logic
app.get("/logout", (req, res) => {
  console.log("User logged out.");
  req.session.reset();
  res.redirect("/");
});

// View login history
app.get("/userHistory", ensureLogin, (req, res) => {
  console.log("Displaying user login history.");
  res.render("userHistory");
});

// 404 Page
app.use((req, res) => {
  console.log(`404 - Page not found: ${req.originalUrl}`);
  res.status(404).render("error");
});

// Export the app for Vercel to use
module.exports = app;
