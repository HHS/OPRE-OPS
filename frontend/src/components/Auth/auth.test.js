import { getAuthorizationCode } from "./auth";

test("construct the URL to get the authentication code to send to the backend", async () => {
    const stateToken = "8966a2f4-4aed-4f6a-a5c7-82032f7fed5d";

    const expectedProviderUrl = new URL("https://dummy/123");
    expectedProviderUrl.searchParams.set("acr_values", "http://idmanagement.gov/ns/assurance/ial/1");
    expectedProviderUrl.searchParams.set("client_id", "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops_jwt");
    expectedProviderUrl.searchParams.set("response_type", "code");
    expectedProviderUrl.searchParams.set("scope", "openid email");
    expectedProviderUrl.searchParams.set("redirect_uri", "http://localhost:3001/login-jwt");
    expectedProviderUrl.searchParams.set("state", stateToken);
    expectedProviderUrl.searchParams.set("nonce", stateToken);

    const actualProviderUrl = getAuthorizationCode(stateToken);

    expect(actualProviderUrl).toEqual(expectedProviderUrl);
});
