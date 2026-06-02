import { Link } from "react-router-dom";
import TabsSection from "./TabsSection";

export default {
    title: "UI/TabsSection",
    component: TabsSection,
    parameters: {
        docs: {
            description: {
                component:
                    "Generic navigation wrapper that renders an array of Link elements as a horizontal tab bar. " +
                    "The parent is responsible for building the Link elements; this component only provides layout and aria-label."
            }
        }
    },
    argTypes: {
        label: {
            control: "text",
            description: "Accessible aria-label for the navigation element"
        }
    }
};

export const Default = {
    args: {
        label: "Agreement tabs",
        links: [
            <Link key="1" to="/agreements">
                Agreements
            </Link>,
            <Link key="2" to="/budget-lines">
                Budget Lines
            </Link>,
            <Link key="3" to="/status">
                Status
            </Link>
        ]
    }
};

export const SingleLink = {
    args: {
        label: "Single section",
        links: [
            <Link key="1" to="/overview">
                Overview
            </Link>
        ]
    }
};

export const ManyLinks = {
    args: {
        label: "Portfolio navigation",
        links: [
            <Link key="1" to="/overview">
                Overview
            </Link>,
            <Link key="2" to="/agreements">
                Agreements
            </Link>,
            <Link key="3" to="/budget">
                Budget
            </Link>,
            <Link key="4" to="/cans">
                CANs
            </Link>,
            <Link key="5" to="/projects">
                Projects
            </Link>,
            <Link key="6" to="/research">
                Research
            </Link>,
            <Link key="7" to="/admin">
                Admin
            </Link>
        ]
    }
};
