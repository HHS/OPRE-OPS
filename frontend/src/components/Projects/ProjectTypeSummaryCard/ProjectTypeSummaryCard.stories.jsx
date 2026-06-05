import ProjectTypeSummaryCard from "./ProjectTypeSummaryCard";
import { PROJECT_TYPE_RESEARCH, PROJECT_TYPE_ADMIN_SUPPORT } from "../ProjectTypes.constants";

export default {
    title: "Features/Projects/ProjectTypeSummaryCard",
    component: ProjectTypeSummaryCard,
    parameters: {
        docs: {
            description: {
                component:
                    "Donut + legend card showing project budget amounts by project type. The donut is " +
                    "hidden when the summed amount is zero. Project types come from `PROJECT_TYPE_ORDER`."
            }
        }
    },
    argTypes: {
        title: { control: "text" }
    }
};

export const Populated = {
    args: {
        title: "Project Spending by Type",
        summary: {
            amounts_by_type: {
                [PROJECT_TYPE_RESEARCH]: { amount: 800_000 },
                [PROJECT_TYPE_ADMIN_SUPPORT]: { amount: 400_000 }
            }
        }
    }
};

export const Empty = {
    args: {
        title: "Project Spending by Type",
        summary: { amounts_by_type: {} }
    }
};
