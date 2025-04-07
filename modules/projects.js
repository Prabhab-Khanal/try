const { Project, Sector, sequelize } = require('../models/projects');  // Correct the path if necessary
const Sequelize = require('sequelize');

// Initialize Sequelize
function initialize() {
    return sequelize.sync() // Sync the models with the database
        .then(() => {
            console.log("Database synchronized.");
            return Promise.resolve();
        })
        .catch((err) => {
            console.log("Failed to sync database:", err);
            return Promise.reject(err);
        });
}

// Get all projects with associated sector data
function getAllProjects(sector) {
    return Project.findAll({
        include: [{
            model: Sector,
            required: false  // This ensures you can fetch projects without sectors as well
        }],
        where: sector ? {
            '$Sector.sector_name$': {
                [Sequelize.Op.iLike]: `%${sector}%` // Case-insensitive search for sector name
            }
        } : {}
    })
    .then(projects => {
        if (projects.length === 0) {
            return Promise.reject(new Error("No projects found."));
        }
        return Promise.resolve(projects); // Return the list of projects
    })
    .catch(err => {
        return Promise.reject(new Error("Unable to retrieve projects: " + err.message));
    });
}

// Get project by id with associated sector data
function getProjectById(projectId) {
    return Project.findOne({ // Use findOne since you want a single project
        where: { id: projectId },
        include: [{
            model: Sector, // Include Sector data
            required: false
        }],
    })
    .then(project => {
        if (!project) {
            return Promise.reject(new Error("Unable to find requested project"));
        }
        return Promise.resolve(project); // Return the single project
    })
    .catch(err => {
        return Promise.reject(new Error("Unable to retrieve project: " + err.message));
    });
}


// Get projects by sector name with associated sector data
function getProjectsBySector(sector) {
    return Project.findAll({
        include: [{
            model: Sector,
            required: false // This ensures you can get projects even if they don't have a sector
        }],
        where: {
            '$Sector.sector_name$': {
                [Sequelize.Op.iLike]: `%${sector}%` // Case-insensitive search for sector name
            }
        }
    })
    .then(projects => {
        if (projects.length === 0) {
            return Promise.reject(new Error("Unable to find requested projects"));
        }
        return Promise.resolve(projects);
    })
    .catch(err => {
        return Promise.reject(new Error("Unable to retrieve projects: " + err.message));
    });
}

// Add this to your projectData.js (or the appropriate file handling project data)

function getAllSectors() {
    return Sector.findAll()  // Fetch all sectors from the database
        .then(sectors => {
            return sectors;
        })
        .catch(err => {
            throw new Error("Unable to retrieve sectors: " + err.message);
        });
}


module.exports = {
    initialize,
    getAllProjects,
    getProjectById,
    getProjectsBySector,
    getAllSectors  // Export this function so it can be used in server.js
};
