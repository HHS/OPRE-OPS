import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { getResearchProjects } from "./getResearchProjects";

test("successfully gets the ResearchProject data with all query params", async () => {
    const portfolioId = 1;
    const fiscalYear = 2023;
    const mockBackendResponse = [
        {
            cans: [],
            description:
                "The National African American Child and Family Research Center, supported by a five-year OPRE...",
            id: 1,
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

    const actualResponse = await getResearchProjects(portfolioId, fiscalYear);
    expect(actualResponse).toStrictEqual(actualResponse);
});
