import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Accordion from "../../components/UI/Accordion";

const UserGuides = () => {
    const components = {
        table: (props) => (
            <table
                className="usa-table"
                {...props}
            />
        )
    };

    return (
        <>
            <h1>User Guide</h1>
            {data.map((item) => (
                <Accordion
                    key={item.heading}
                    heading={item.heading}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={components}
                    >
                        {item.content}
                    </ReactMarkdown>
                </Accordion>
            ))}
        </>
    );
};

const data = [
    {
        heading: "What is OPS?",
        content: `OPS stands for OPRE’s Portfolio Management System (OPS). It is a centralized place for OPRE to plan and track their budget and projects across Divisions and Portfolios.`
    },
    {
        heading: "What benefits does OPS provide?",
        content: `
**Transparency**

Access is no longer limited to your specific contracts only. Everyone can view everything including budget and spending data for each Portfolio and funding details for every CAN. Changes are tracked via history so you can easily understand who changed what and when.

**Improved information architecture**

Budget and spending data can be viewed in more diverse and customized ways like across a portfolio, project, or CAN, in addition to the individual agreement level.

**Autonomy**

Team Leaders, CORs and other team members can create and edit agreements directly instead of having to email the budget team to make updates.

**Built-in Approvals**

Division Directors will formally approve budget and status changes in the system rather than through email.

**Pre-planning**

Plans can be entered into the system as Drafts instead of having to wait until plans are more formalized. This will provide a more holistic view of the data across all stages of planning.
        `
    },
    {
        heading: "What are the different user roles and what can they do?",
        content: `
**Overview of OPS user roles**

- Viewer/Editor
- Reviewer/Approver
- Budget Team
- Procurement Team

**What user role do I have?**

Check and see what user role you have by clicking on your email address link at the top of your screen.

**Viewer/Editor**

People with the Viewer/Editor role are generally Team Leaders, CORs, or other team members like Research Analysts, Management Analysts, or Program Analysts.

Individuals with a viewer/editor role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if listed as a team member
- Request a status change on budget lines for their agreements
- Complete the procurement tracker tasks for their agreements [not yet developed, coming soon]
- Start a contract modification [not yet developed, coming soon]

**Reviewer/Approver**

People with the Reviewer/Approver role are generally Division Directors or Deputy Directors who oversee the budget across their division and portfolios.

Individuals with a reviewer/approver role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if a team member
- Review and approve budget changes for budget lines using CANs within their Division
- Review and approve budget line status changes for budget lines using CANs within their Division
- Review and approve for Pre-Award during the procurement process (not yet developed, coming - soon)
- Review and approve contract modifications (not yet developed, coming soon)

**Budget Team**

People on the budget team are responsible for overseeing the budget across OPRE, forecasting trends in spending and budgets, and balancing the budget across external systems.

Individuals with a budget team role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if a team member
- Edit CAN details, budget, and funding received
- Review and approve agreements for Pre-Award during the procurement process [not yet developed, coming soon]
  - Review the final consensus memo
  - Submit the requisition and write a check for the total in executing status
- Review and approve agreements for Award during the procurement process [not yet developed, coming soon]
  - Ensure CLINs entered by CORs match the signed award
  - Review vendor information entered by CORs
  - Review award information entered by CORs
  - Enter the Obligated Date for budget lines in executing status

**Procurement Team**

People on the procurement team track the procurement process across OPRE and help coordinate between CORs and the procurement shops

Individuals with a procurement team role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit Projects
- Create Agreements and edit them if a team member
- View the status of procurement tasks across all agreements [not yet developed, coming soon]
- Reset procurement steps, if needed [not yet developed, coming soon]
        `
    },
    {
        heading: "How is OPS organized?",
        content: `
**The portfolio, project, and agreement relationship**

Each OPRE division has one or more portfolios. This is the first level of organization. Within each portfolio, projects can be created to assist in grouping different agreements together. There are different types of agreements—contracts, grants, or IAAs. Currently, only contracts and IAAs are available, with grants coming soon.

**The agreement lifecycle and budget line statuses**

All new budget lines start in Draft Status.

| BL Status | Meaning |
|-----------|---------|
| Draft              | In pre-planning, placeholders, and what-ifs; not yet solidified |
| Planned            | Intended to happen; money set aside as planned (even if changes occur). The amount is subtracted from the available FY budget |
| Executing          | In the procurement process; being formally committed |
| Obligated          | Committed in the signed award and can be invoiced against to begin work |
| In Review          | Pending edits or status change requests that need approval or decline |
        `
    },
    {
        heading: "How to view notifications",
        content: `
1. Click on the bell icon at the top right corner of the page
1. Any notifications will appear on the right side of the page
        `
    },
    {
        heading: "How to create a project",
        content: `
1. Click Create on the top navigation bar, then click Project
1. Fill out all of the required fields and click on the Create Project button. All data will be validated for completeness and required fields will need to be filled out before the project can be created.
    - When you are done filling out the fields, click on the Create Project button
1. This will send a notification to members of your portfolio to give them awareness
        `
    },
    {
        heading: "How to create an agreement",
        content: `
1. There are 2 ways to create a new agreement
    - a. Click Agreements in the top navigation bar, then click Add Agreement on the right side of the page
    - b. __OR__ click Create on the top navigation bar, then click Agreement
1. Complete step 1 by selecting a project the agreement should be associated with and click the Continue button
    - a. If the agreement needs to be associated with a project that is not listed, click the Add New Project button
    - b. See How to create a project
1. Complete step 2 by filling out the agreement details and click the Continue button
    - a. Not all information is required, and can be filled out later if you need to skip something. However, all data will need to be filled out before a budget line can be changed from Draft to Planned Status
    - b. You can click the Save Draft button to exit the create agreement process, save your data entry, and come back later, if needed
    - c. Anyone you add as a Team Member will be able to edit the agreement
        - Make sure you add yourself as a Team Member if you need to edit this agreement in the future
        - Divisions Directors will be auto-added as Team Members for any agreement using CANs within their Division
        - Team Leaders will be auto-added as Team Members for any agreement using CANs within their Portfolio
        `
    },
    {
        heading: "",
        content: ``
    }
];

export default UserGuides;
