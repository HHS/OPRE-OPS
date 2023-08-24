import { getAuthorizationCode } from "./auth";

test("construct the URL to get the authentication code to send to the backend", async () => {
    // the nonce is generated at runtime so do not test here
    const stateToken = "admin_user";

    const actualProviderUrl = getAuthorizationCode("fakeauth", stateToken);
    const base_url = actualProviderUrl.href.split("?")[0];
    expect(base_url).toEqual("https://dummy/123");
    expect(actualProviderUrl.searchParams.get("acr_values")).toEqual("http://acr/values");
    expect(actualProviderUrl.searchParams.get("client_id")).toEqual("blah:blah");
    expect(actualProviderUrl.searchParams.get("response_type")).toEqual("blah");
    expect(actualProviderUrl.searchParams.get("scope")).toEqual("blah blah");
    expect(actualProviderUrl.searchParams.get("redirect_uri")).toEqual("http://uri/login");
    expect(actualProviderUrl.searchParams.get("state")).toEqual(stateToken);
});
