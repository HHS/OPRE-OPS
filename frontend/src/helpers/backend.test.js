import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({ default: vi.fn(() => Promise.resolve({ data: {} })) }));
vi.mock("../components/Auth/auth", () => ({
    getAccessToken: vi.fn(() => null),
    getRefreshToken: vi.fn(() => null)
}));

// BACKEND_DOMAIN is resolved once at module load, so each case re-imports the module.
const calledUrl = async () => {
    vi.resetModules();
    const { callBackend } = await import("./backend");
    await callBackend("/api/v1/agreements/", "GET");
    return axios.mock.calls.at(-1)[0].url;
};

describe("callBackend backend domain precedence", () => {
    beforeEach(() => {
        axios.mockClear();
        delete window.__RUNTIME_CONFIG__;
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        delete window.__RUNTIME_CONFIG__;
    });

    it("uses the runtime config domain over the build-time domain", async () => {
        window.__RUNTIME_CONFIG__ = { REACT_APP_BACKEND_DOMAIN: "https://runtime.example.com" };
        vi.stubEnv("VITE_BACKEND_DOMAIN", "https://build.example.com");

        expect(await calledUrl()).toBe("https://runtime.example.com/api/v1/agreements/");
    });

    it("uses the build-time domain when no runtime config is set", async () => {
        vi.stubEnv("VITE_BACKEND_DOMAIN", "https://build.example.com");

        expect(await calledUrl()).toBe("https://build.example.com/api/v1/agreements/");
    });

    it("falls back to localhost when neither is set", async () => {
        vi.stubEnv("VITE_BACKEND_DOMAIN", "");

        expect(await calledUrl()).toBe("https://localhost:8000/api/v1/agreements/");
    });
});
