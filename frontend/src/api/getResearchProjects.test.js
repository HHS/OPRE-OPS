import { getResearchProject, getResearchProjectByName, getAllResearchProjects } from "./getResearchProjects";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

// Set up a mock backend response for each test.
const mockBackendResponse = [
    {
        id: 1,
        name: "Test Research Project 1",
        description: "A test research project 1.",
    },
    {
        id: 2,
        name: "Test Research Project 2",
        description: "A test research project 2.",
    },
    {
        id: 3,
        name: "Test Research Project 3",
        description: "A test research project 3.",
    },
];

test("successfully gets a research project by ID", async () => {
    // Set up a mock callBackend function that returns the mock backend response.
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse[0];
    });

    const id = 1;
    const actualResult = await getResearchProject(id);
    expect(actualResult).toStrictEqual(mockBackendResponse[0]);
});

test("successfully gets a research project by name", async () => {
    // Set up a mock callBackend function that returns the mock backend response.
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse[0];
    });

    const name = "Test Research Project";
    const actualResult = await getResearchProjectByName(name);
    expect(actualResult).toStrictEqual(mockBackendResponse[0]);
});

test("should get all Research Projects", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [mockBackendResponse];
    });

    const actualGetAgreements = await getAllResearchProjects();
    expect(actualGetAgreements).toStrictEqual([mockBackendResponse]);
});
