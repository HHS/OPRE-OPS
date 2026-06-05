import ProjectTypeSummaryCard from "./ProjectTypeSummaryCard";
import { PROJECT_TYPE_RESEARCH, PROJECT_TYPE_ADMIN_SUPPORT } from "../ProjectTypes.constants";

const buildSummary = ({ researchAmount, adminSupportAmount }) => ({
    amounts_by_type: {
        [PROJECT_TYPE_RESEARCH]: { amount: researchAmount },
        [PROJECT_TYPE_ADMIN_SUPPORT]: { amount: adminSupportAmount }
    }
});

const amountControl = {
    control: { type: "number", min: 0, step: 25_000 },
    table: { category: "Amounts by Project Type" }
};

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
        title: { control: "text", table: { category: "General" } },
        researchAmount: amountControl,
        adminSupportAmount: amountControl
    },
    render: (args) => (
        <ProjectTypeSummaryCard
            title={args.title}
            summary={buildSummary(args)}
        />
    )
};

export const Populated = {
    args: {
        title: "Project Spending by Type",
        researchAmount: 800_000,
        adminSupportAmount: 400_000
    }
};

export const Empty = {
    args: {
        title: "Project Spending by Type",
        researchAmount: 0,
        adminSupportAmount: 0
    }
};
