// __tests__/projects.test.js

const projectData = require("../modules/projects");

// Mock data
const mockProjects = [
    { id: 1, title: "Test Project 1", summary_short: "Summary 1", sector_id: 1 },
    { id: 2, title: "Test Project 2", summary_short: "Summary 2", sector_id: 2 },
];

const mockSectorData = [
    { id: 1, sector_name: "Renewable Energy" },
    { id: 2, sector_name: "Technology" },
];

// Mock the projectData methods
jest.mock("../modules/projects", () => ({
    getAllProjects: jest.fn(),
    getProjectById: jest.fn(),
}));

describe("Unit tests for project functions by Sarbesh Khadka", () => {

    beforeEach(() => {
        // Reset the mocks before each test
        projectData.getAllProjects.mockReset();
        projectData.getProjectById.mockReset();
    });

    test("getAllProjects should return all projects", async () => {
        // Mock the return value of getAllProjects
        projectData.getAllProjects.mockResolvedValue(mockProjects);

        // Call the function and check the result
        const result = await projectData.getAllProjects();
        expect(result).toEqual(mockProjects);
        expect(result.length).toBe(2);
    });

    test("getAllProjects should handle errors if no projects are found", async () => {
        // Mock the case where no projects are found
        projectData.getAllProjects.mockRejectedValue(new Error("No projects found."));

        // Expect the function to throw an error
        await expect(projectData.getAllProjects()).rejects.toThrow("No projects found.");
    });

    test("getProjectById should return a project by its ID", async () => {
        const projectId = 1;
        const project = { ...mockProjects[0], sector: "Renewable Energy" };

        // Mock the return value of getProjectById
        projectData.getProjectById.mockResolvedValue(project);

        // Call the function and check the result
        const result = await projectData.getProjectById(projectId);
        expect(result).toEqual(project);
        expect(result.id).toBe(projectId);
        expect(result.title).toBe("Test Project 1");
    });

    test("getProjectById should handle errors if project is not found", async () => {
        const invalidProjectId = 999;

        // Mock the case where the project is not found
        projectData.getProjectById.mockRejectedValue(new Error("Project not found."));

        // Expect the function to throw an error
        await expect(projectData.getProjectById(invalidProjectId)).rejects.toThrow("Project not found.");
    });
});
