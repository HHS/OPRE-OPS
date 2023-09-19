import { getAuthorizationCode, isValidToken } from "./auth";

const expiredToken =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNjk1MTQ5NTkxLCJqdGkiOiJlOGUwMTY2ZS1lNTYyLTQ3N2UtOWJiMy05MjA1OTFiNmEyMjUiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiMDAwMDAwMDAtMDAwMC0xMTExLWExMTEtMDAwMDAwMDAwMDE4IiwibmJmIjoxNjk1MTQ5NTkxLCJleHAiOjEwMDAwMDAwMDEsImlzcyI6Imh0dHBzOi8vb3ByZS1vcHMtYmFja2VuZCIsImF1ZCI6Imh0dHBzOi8vb3ByZS1vcHMtZnJvbnRlbmQiLCJyb2xlcyI6WyJhZG1pbiJdfQ.RWvGtcZCxGGaqX_28LSfFqcza32sU4zZnfC_niCJP3X6V9vTRGjONEfLoZS9_TjGbx0TZHHMdZRnCWF2LW_84mTJEhizqad8nmVHnagvehfrjUcS9Fe1wn6ZvjlQfSiX9iibgfXjV0WjlNeKuNx3nLhcSt0yKiwpw-7BoPUjQKYQcjmNYfL6rzqxj85MIsHo09ifxKDmmOePiFqZEgyUDakovSMrS-nGFif3sArUC7dmJRuEO3KdFGD9Dc9rY1RItlBYl4xSlq3bZDwDmH5DWlJ_22LjW2Xq04LJwLFbagOjcsDQhRIOHevviX6S3xBfzZf_NDx8ZFhj3FXIItQ4QQw";
const badIssToken =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNjk1MTQ5NTkxLCJqdGkiOiJlOGUwMTY2ZS1lNTYyLTQ3N2UtOWJiMy05MjA1OTFiNmEyMjUiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiMDAwMDAwMDAtMDAwMC0xMTExLWExMTEtMDAwMDAwMDAwMDE4IiwibmJmIjoxNjk1MTQ5NTkxLCJleHAiOjE5NjUxNTEzOTEsImlzcyI6Imh0dHA6Ly9vcHMtaW52YWxpZC1pc3N1ZXIiLCJhdWQiOiJodHRwczovL29wcmUtb3BzLWZyb250ZW5kIiwicm9sZXMiOlsiYWRtaW4iXX0.MQG1wzAEZV4Aq-KPXeT0E0NFGB-2d1Xm9ZkhUz15BGna-c37VredS-r75zA9OkK5r5pPvjdJU5mNPrr1co4SdEtnZK8PW4Ilvi_XMHwTflBV8cOhoz74jEbf0Hj_CDPX3PCsH4Surxun7CELTR775QYRa5EdEgxUX7LREJXZj1PhHissr8tQpr30LWAKLqNUr0KXJGauXN-YxfbuT_fxlV_P6Q_mY0RqEZAdvgmZs3KB3L_hqb7tj6TCtieXXIEkZICZGIPCq9rd3kYAQoDjGO8Qw5hnePTK_focZ46Rj1gcrLa_Ot-qg0L6GzJdv_Qmby5akIGc8i7kCDzmL_BHZw";
const validToken =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNjk1MTQ5NTkxLCJqdGkiOiJlOGUwMTY2ZS1lNTYyLTQ3N2UtOWJiMy05MjA1OTFiNmEyMjUiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiMDAwMDAwMDAtMDAwMC0xMTExLWExMTEtMDAwMDAwMDAwMDE4IiwibmJmIjoxNjk1MTQ5NTkxLCJleHAiOjE5NjUxNTEzOTEsImlzcyI6Imh0dHBzOi8vb3ByZS1vcHMtYmFja2VuZCIsImF1ZCI6Imh0dHBzOi8vb3ByZS1vcHMtZnJvbnRlbmQiLCJyb2xlcyI6WyJhZG1pbiJdfQ.sC7t-OAFR_FptdmErn5id8NIW-sYQpoUezX7n07Wp3BbV0pcULhoQL7C-sFf2uRiXjWKwDdXU1ZVOzRcxb97v-e7FsMJd5Ds7va2uz8U3qGaJwH3dWrGotl4m1CWIgQ807euIhVtDLFTeePyhXwhpAPF-WLVWGWP1GaTTnhM_bpRwYqt653Dt5A6aU9TKtcUPhhHaEnZMxpooo5L1vX32agxvDEsf8D7X78f7S18eFM7GWyVSU0ZByPjaj6iAggUYmiuDu8acCaZfFTQKz-0v_zEyupP8goqCixbxEkhcUiY6V6Ud0szVryvlQcN-hsrq1wQWxk8SYQDKOrxmWu99Q";

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

describe("isValidToken", () => {
    it("returns false if token is not provided", () => {
        expect(isValidToken().isValid).toBe(false);
    });

    it("returns false if token is expired", () => {
        expect(isValidToken(expiredToken).isValid).toBe(false);
        expect(isValidToken(expiredToken).msg).toBe("EXPIRED");
    });

    it("returns false if token is not issued by the backend", () => {
        expect(isValidToken(badIssToken).isValid).toBe(false);
        expect(isValidToken(badIssToken).msg).toBe("ISSUER");
    });

    it("returns true if token is valid", () => {
        expect(isValidToken(validToken).isValid).toBe(true);
        expect(isValidToken(validToken).msg).toBe("VALID");
    });
});
