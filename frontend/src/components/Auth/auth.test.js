import { getAuthorizationCode } from "./auth";

test("construct the URL to get the authentication code to send to the backend", async () => {
    const stateToken = "8966a2f4-4aed-4f6a-a5c7-82032f7fed5d";

    const expectedProviderUrl = new URL("https://dummy/123");
    expectedProviderUrl.searchParams.set("acr_values", "http://acr/values");
    expectedProviderUrl.searchParams.set("client_id", "blah:blah");
    expectedProviderUrl.searchParams.set("response_type", "blah");
    expectedProviderUrl.searchParams.set("scope", "blah blah");
    expectedProviderUrl.searchParams.set("redirect_uri", "http://uri/login");
    expectedProviderUrl.searchParams.set("state", stateToken);
    expectedProviderUrl.searchParams.set("nonce", stateToken);

    const actualProviderUrl = getAuthorizationCode(stateToken);

    expect(actualProviderUrl.toString()).toEqual(expectedProviderUrl.toString());
});
