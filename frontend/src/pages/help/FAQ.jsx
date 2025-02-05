import ReactMarkdown from "react-markdown";
import Accordion from "../../components/UI/Accordion";

const FAQ = () => {
    return (
        <>
            <h2>Frequently Asked Questions</h2>
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

// Markdown Guide https://www.markdownguide.org/basic-syntax/
const data = [
    {
        heading: "How do I get started in OPS or learn how to use it?",
        content: `You can learn how to use OPS by checking out the How-to Guides, attending office hours or reaching out for help.

- Link to how-to guides
- Info on office hours
- Link to help
`
    },
    {
        heading: "What functionality is currently available in OPS?",
        content: `
- View a Research Portfolio including the FY budget and spending
- View a list of all agreements across OPRE
- View a list of my agreements
- Create a new Agreement (contracts only)
- View an Agreement Details page (contracts only)
- Edit an Agreement including budget line status changes (contracts only)
- Receive built-in approvals from Division Directors on any budget changes or BL status changes
- View a list of all CANs across OPRE
- View a list of my CANs
- View a CAN Details page including the FY budget and spending
- View a list of all budget lines across OPRE
- View a list of my budget lines
- View notifications and history of changes
`
    },
    {
        heading: "What functionality will be added to OPS in the future?",
        content: `
OPS will continue to get new features and improvements on a regular basis. A few on our list so far:

- View a Portfolio’s People & Teams information
- Create, view or edit other agreement types like grants, IAAs, AAs and Direct Obligations
- Utilize an in-app Procurement Tracker with steps and progress through the procurement process
- Create, view or edit Projects
- Start contract modifications
- Download reports
`
    },
    {
        heading: "How do approvals work for cross-portfolio agreements?",
        content: `
For cross-portfolio or shared-work, you would just choose the CANs for each budget line, and budget or status changes will go to the respective approvers. Each CAN has a managing Portfolio and approvers are determined through the Division of that Portfolio.
`
    },
    {
        heading: "Will I receive an email notification when changes are made in OPS?",
        content: `For now, users will need to log into OPS to view notifications. You can see what’s happened by clicking the bell icon in the top righthand side of the page or by viewing the history section on the Portfolio, Agreement or CAN pages. Email notifications will be added in the near future, and we’ll send an update once they are ready!
        `
    },
    { heading: "Can I download data from OPS?", content: `Coming soon...` },
    {
        heading: "Does OPS track invoicing and if so how?",
        content: `Yes, but only from the payment perspective, since approving happens in IPP.
`
    },
    {
        heading: "Who changes BL statuses?",
        content: `In order to change a BL Status, team members of an agreement must go through the “Request BL Status Change” process on the Agreement Details Page. All status changes need Division Director approval.

Status changes includes:

- Draft to Planned
- Planned to Executing
- Executing to Obligated
- And downgrades such as..
- Planned to Draft
- Executing to Planned
- Executing to Draft
`
    }
];
export default FAQ;
