import { apiLogin } from "./apiLogin";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

test("successfully gets an access_token and refresh_token from the backend", async () => {
    const auth_code = 99999999;
    const mockBackendResponse = {
        access_token: "super-secure-token",
        refresh_token: "also-super-secure",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [mockBackendResponse];
    });

    const actualGetCfy = await apiLogin(auth_code);
    expect(actualGetCfy).toStrictEqual([mockBackendResponse]);
});
