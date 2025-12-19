import { render, screen } from "@testing-library/react";
import VersionPage from "./VersionPage";
import packageJson from "../../../package.json";

describe("VersionPage", () => {
    it("should render the version from package.json", () => {
        render(<VersionPage />);
        expect(screen.getByText(`Version: ${packageJson.version}`)).toBeInTheDocument();
    });

    it("should render a heading", () => {
        render(<VersionPage />);
        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toBeInTheDocument();
    });
});
