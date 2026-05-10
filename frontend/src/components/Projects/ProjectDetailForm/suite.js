import { create, test, enforce } from "vest";

const VALID_PROJECT_TYPES = ["Research", "Admin & Support"];

const suite = create((data = {}) => {
    test("title", "This is required information", () => {
        enforce(data["title"]).isNotBlank();
    });
    test("project_type", "Please select a valid project type", () => {
        enforce(data["project_type"]).inside(VALID_PROJECT_TYPES);
    });
});

export default suite;
