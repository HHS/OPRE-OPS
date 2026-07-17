import { describe, expect, it, vi } from "vitest";
import { proceedIfBlocked } from "./proceedIfBlocked";

describe("proceedIfBlocked", () => {
    it("does nothing when blocker is null", async () => {
        await expect(proceedIfBlocked(null)).resolves.toBeUndefined();
    });

    it("does nothing when blocker is not in blocked state", async () => {
        const blocker = { state: "unblocked", proceed: vi.fn() };
        await proceedIfBlocked(blocker);
        expect(blocker.proceed).not.toHaveBeenCalled();
    });

    it("calls proceed when blocker is blocked", async () => {
        const blocker = { state: "blocked", proceed: vi.fn().mockResolvedValue(undefined) };
        await proceedIfBlocked(blocker);
        expect(blocker.proceed).toHaveBeenCalled();
    });

    it("suppresses the known React Router blocker state transition error", async () => {
        const blocker = {
            state: "blocked",
            proceed: vi.fn().mockRejectedValue(new Error("Invalid blocker state transition from proceeding"))
        };
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        await expect(proceedIfBlocked(blocker)).resolves.toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            "Ignored known React Router blocker exception:",
            "Invalid blocker state transition from proceeding"
        );
        warnSpy.mockRestore();
    });

    it("re-throws unknown errors from proceed", async () => {
        const blocker = {
            state: "blocked",
            proceed: vi.fn().mockRejectedValue(new Error("some other error"))
        };
        await expect(proceedIfBlocked(blocker)).rejects.toThrow("some other error");
    });
});
