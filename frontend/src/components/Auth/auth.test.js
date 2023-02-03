import { getAuthorizationCode } from "./auth";

test("construct the URL to get the authentication code to send to the backend", async () => {
    // the nonce is generated at runtime so do not test here
    const stateToken = "8966a2f4-4aed-4f6a-a5c7-82032f7fed5d";

    const actualProviderUrl = getAuthorizationCode(stateToken);

    expect(actualProviderUrl.href.split("?")[0]).toEqual("https://dummy/123");
    expect(actualProviderUrl.searchParams.get("acr_values")).toEqual("http://acr/values");
    expect(actualProviderUrl.searchParams.get("client_id")).toEqual("blah:blah");
    expect(actualProviderUrl.searchParams.get("response_type")).toEqual("blah");
    expect(actualProviderUrl.searchParams.get("scope")).toEqual("blah blah");
    expect(actualProviderUrl.searchParams.get("redirect_uri")).toEqual("http://uri/login");
    expect(actualProviderUrl.searchParams.get("state")).toEqual(stateToken);
});
