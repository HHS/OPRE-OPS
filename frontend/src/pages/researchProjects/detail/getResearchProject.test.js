import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { getResearchProject } from "./getResearchProject";

test("successfully gets the Research Project from the backend", async () => {
    const projectId = 1;
    const mockBackendResponse = [
        {
            cans: [],
            description:
                "The National African American Child and Family Research Center, supported by a five-year OPRE...",
            id: projectId,
            methodologies: [],
            origination_date: "2022-01-01",
            populations: [],
            portfolio_id: 1,
            short_title: "",
            title: "African American Child and Family Research Center",
            url: "https://acf.gov/opre/project/african-american-child-and-family-research-center"
        }
    ];

    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [mockBackendResponse];
    });

    const actualResponse = await getResearchProject(projectId);
    expect(actualResponse).toStrictEqual(actualResponse);
});

test("required param missing", () => {
    expect.assertions(1);
    return getResearchProject().catch((e) =>
        expect(e).toEqual(
            expect.objectContaining({
                message: "id is required"
            })
        )
    );
});
