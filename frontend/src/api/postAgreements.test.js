import { postAgreement, formatTeamMember } from "./postAgreements";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

describe("postAgreement function", () => {
    const mockAgreement = {
        agreement_type: "CONTRACT",
        agreement_reason: "NEW_REQ",
        name: "Agreement144",
        description: "Description",
        selected_product_service_code: {
            created_by: null,
            created_on: "2023-04-25T17:22:15.122472",
            description: "",
            id: 1,
            name: "Service-Code-1",
            updated_on: "2023-04-25T17:22:15.122472",
        },
        incumbent: "Vendor A",
        project_officer: {
            created_by: null,
            created_on: "2023-04-25T17:22:11.766571",
            date_joined: "2023-04-25T17:22:11.766571",
            division: 1,
            email: "chris.fortunato@example.com",
            first_name: "Chris",
            full_name: "Chris Fortunato",
            id: 1,
            last_name: "Fortunato",
            oidc_id: "00000000-0000-1111-a111-000000000001",
            updated: null,
            updated_on: "2023-04-25T17:22:11.766571",
        },
        team_members: [
            {
                created_by: null,
                created_on: "2023-04-25T17:22:11.766571",
                date_joined: "2023-04-25T17:22:11.766571",
                division: 1,
                email: "Ivelisse.Martinez-Beck@example.com",
                first_name: "Ivelisse",
                full_name: "Ivelisse Martinez-Beck",
                id: 3,
                last_name: "Martinez-Beck",
                oidc_id: "00000000-0000-1111-a111-000000000003",
                updated: null,
                updated_on: "2023-04-25T17:22:11.766571",
            },
            {
                created_by: null,
                created_on: "2023-04-25T17:22:11.766571",
                date_joined: "2023-04-25T17:22:11.766571",
                division: 3,
                email: "Tia.Brown@example.com",
                first_name: "Tia",
                full_name: "Tia Brown",
                id: 5,
                last_name: "Brown",
                oidc_id: "00000000-0000-1111-a111-000000000005",
                updated: null,
                updated_on: "2023-04-25T17:22:11.766571",
            },
        ],
        notes: "New Agreement for purpose X",
    };

    const emptyMockAgreement = {
        agreement_type: null,
        agreement_reason: null,
        name: "",
        description: "",
        selected_product_service_code: null,
        incumbent: null,
        project_officer: null,
        team_members: [],
        notes: "",
    };

    const mockApiResponse = { id: 1, message: "Agreement created" };

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("returns the API response data", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return mockApiResponse;
        });

        const response = await postAgreement(mockAgreement);
        expect(response).toStrictEqual(mockApiResponse);
    });

    test("successfully takes an empty agreement object", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return mockApiResponse;
        });

        const response = await postAgreement(emptyMockAgreement);
        expect(response).toStrictEqual(mockApiResponse);
    });
});

describe("formatTeamMember function", () => {
    test("returns a team member object with the expected properties", () => {
        const input = {
            created_by: null,
            created_on: "2023-04-24T18:14:38.156209",
            date_joined: "2023-04-24T18:14:38.156209",
            division: 1,
            email: "tm_a@test.com",
            first_name: "Team",
            full_name: "Team Member A",
            id: 123,
            last_name: "Member A",
            oidc_id: "00000000-0000-1111-a111-000000000002",
            updated: null,
            updated_on: "2023-04-24T18:14:38.156209",
        };

        const expectedOutput = {
            id: 123,
            full_name: "Team Member A",
            email: "tm_a@test.com",
        };

        const output = formatTeamMember(input);

        expect(output).toEqual(expectedOutput);
    });
});
