import ReactMarkdown from "react-markdown";
import Accordion from "../../components/UI/Accordion";

const UserGuides = () => {
    return (
        <>
            <h1>User Guide</h1>
            {data.map((item) => (
                <Accordion
                    key={item.heading}
                    heading={item.heading}
                >
                    <ReactMarkdown>{item.content}</ReactMarkdown>
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
- Review and approve agreements for Pre-Award during the procurement process [not yet developed, - coming soon]
  - Review the final consensus memo
  - Submit the requisition and write a check for the total in executing status
- Review and approve agreements for Award during the procurement process [not yet developed, - coming soon]
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
        heading: "",
        content: ``
    }
];

export default UserGuides;
