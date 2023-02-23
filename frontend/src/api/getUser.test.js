import { getUser, getUserByOidc } from "./getUser";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

test("successfully gets a User from the backend by user_id", async () => {
    const userId = 4;
    const mockBackendResponse = {
        id: userId,
        oidc_id: "00000000-0000-1111-a111-000000000004",
        email: "username@domain.com",
        first_name: "User",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [mockBackendResponse];
    });

    const actualGetCfy = await getUser(userId);
    expect(actualGetCfy).toStrictEqual([mockBackendResponse]);
});

test("successfully gets a User from the backend by user_oidc_id", async () => {
    const oidcId = 4;
    const mockBackendResponse = {
        id: oidcId,
        oidc_id: "00000000-0000-1111-a111-000000000004",
        email: "username@domain.com",
        first_name: "User",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [mockBackendResponse];
    });

    const actualGetCfy = await getUserByOidc(oidcId);
    expect(actualGetCfy).toStrictEqual([mockBackendResponse]);
});
