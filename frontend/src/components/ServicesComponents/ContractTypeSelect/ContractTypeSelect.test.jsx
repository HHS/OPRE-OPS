import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import ContractTypeSelect from "./ContractTypeSelect";

describe("ContractTypeSelect", () => {
    test("renders all contract type options including Hybrid with descriptive text", () => {
        render(
            <ContractTypeSelect
                value=""
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText("Firm Fixed Price (FFP)")).toBeInTheDocument();
        expect(screen.getByText("Time & Materials (T&M)")).toBeInTheDocument();
        expect(screen.getByText("Cost Plus Fixed Fee (CPFF)")).toBeInTheDocument();
        expect(screen.getByText("Cost Plus Award Fee (CPAF)")).toBeInTheDocument();
        expect(screen.getByText("Hybrid (Any combination of the above)")).toBeInTheDocument();
    });
});
