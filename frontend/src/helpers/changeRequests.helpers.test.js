import { describe, expect, it } from "vitest";
import { renderChangeValues } from "./changeRequests.helpers";

describe("renderChangeValues", () => {
    it("renders an amount change as currency", () => {
        const { oldValue, newValue } = renderChangeValues("amount", { amount: { old: 300000, new: 333333 } });
        expect(oldValue).toBe("$300,000.00");
        expect(newValue).toBe("$333,333.00");
    });

    it("renders a CAN change using the resolved CAN names", () => {
        const { oldValue, newValue } = renderChangeValues("can_id", { can_id: { old: 13, new: 10 } }, "CAN 1", "CAN 2");
        expect(oldValue).toBe("CAN 1");
        expect(newValue).toBe("CAN 2");
    });

    it("renders a de-obligation as the original obligated amount going to the net amount (OPS-6488)", () => {
        const { oldValue, newValue } = renderChangeValues("requested_de_obligation_amount", {
            requested_de_obligation_amount: { old: 500000, new: 100000 }
        });
        expect(oldValue).toBe("$500,000.00");
        expect(newValue).toBe("$400,000.00");
    });

    it("renders a deletion change with the amount as From and 'Deleted' as To", () => {
        const { oldValue, newValue } = renderChangeValues("delete", { delete: { old: 500000, new: "Deleted" } });
        expect(oldValue).toBe("$500,000.00");
        expect(newValue).toBe("Deleted");
    });
});
