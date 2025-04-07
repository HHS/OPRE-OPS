import ReactMarkdown from "react-markdown";
import Accordion from "../../components/UI/Accordion";

const FAQ = () => {
    return (
        <>
            <h2 className="margin-bottom-4">Frequently Asked Questions</h2>
            <section className="usa-prose">
                {data.map((item) => (
                    <Accordion
                        key={item.heading}
                        heading={item.heading}
                        level={3}
                        isClosed={true}
                    >
                        <ReactMarkdown>{item.content}</ReactMarkdown>
                    </Accordion>
                ))}
            </section>
        </>
    );
};

// Markdown Guide https://www.markdownguide.org/basic-syntax/
const data = [
    {
        heading: "How do I learn how to use OPS?",
        content: `You can learn how to use OPS by checking out the How-to Guides, attending office hours or reaching out for help.

- [How-to guides](/help-center)
- Info on office hours
- Reach out for help by emailing <opre-ops-support@flexion.us>.
`
    },
    {
        heading: "What functionality is currently available in OPS?",
        content: `
- View all portfolios across OPRE including their FY budget and spending
- View a list of all agreements across OPRE
- View a list of My Agreements
- Create a new agreement (contracts only)
- View an Agreement Details page (contracts only)
- Edit an agreement including budget line status changes (contracts only)
- Built-in approvals from Division Directors on any budget changes or status changes
- View a list of all CANs across OPRE
- View a list of My CANs
- View a CAN Details page including the FY budget and spending
- View a list of all budget lines across OPRE
- View a list of My Budget Lines
- View notifications and a history of changes
- Export data
`
    },
    {
        heading: "What functionality will be added to OPS in the future?",
        content: `
OPS will continue to get new features and improvements on a regular basis. If you have ideas, please share your feedback by emailing <opre-ops-support@flexion.us>. A few items on our list so far include:

- View a Portfolio’s People & Teams information
- Create, view or edit other agreement types like grants, IAAs, AAs and Direct Obligations
- Utilize an in-app Procurement Tracker with steps and progress through the procurement process
- Create, view or edit Projects
- Start contract modifications
- Download detailed reports
- Manage invoicing
- Email notifications
`
    },
    {
        heading: "What's the process for updating or editing our agreements while OPS is still being actively developed?",
        content: `
You can edit/update your agreements that are contracts directly in OPS. However, other agreement types are not fully developed yet and cannot be edited in OPS yet. The pages that are not editable will have an alert at the top so you know which pages aren’t fully developed yet. Thank you for your patience on this!
`
    },
    {
        heading: "What data is not editable in OPS yet?",
        content: `
For cross-portfolio or shared-work, you would just choose the CANs for each budget line, and budget or status changes will go to the respective approvers. Each CAN has a managing Portfolio and approvers are determined through the Division of that Portfolio.
- Creating or editing Grants
- Creating or editing IAAs
- Creating or editing AAs
- Creating or editing Direct Obligations
- Changing a BL status from Executing to Obligated on a contract and the associated procurement steps
`
    },
    {
        heading: "How do we update data that is not editable in OPS yet?",
        content: `
If you need to change something in OPS that's not editable yet, email the budget team requesting the update. The Budget Team will update the OPRE budget spreadsheet and the OPS team will sync updates between the OPRE budget spreadsheet and OPS on a daily basis. Depending on when the change is entered into the spreadsheet, your update should show up in OPS within a day or two.
`
    },
    {
        heading: "How do approvals work for cross-portfolio agreements?",
        content: `
For cross-portfolio or shared-work, you would just choose the CANs for each budget line, and budget or status changes will go to the respective approvers for each CAN. Every CAN is assigned to a managing Portfolio and approvers are determined through the Division of that Portfolio.
`
    },
    {
        heading: "Will I receive an email notification when changes are made in OPS?",
        content: `For now, users will need to log into OPS to view notifications. You can see what’s happened by clicking the bell icon in the top righthand side of the page or by viewing the history section on the Portfolio, Agreement, or CAN pages. Email notifications will be added in the near future, and we’ll send an update once they are ready!
        `
    },
    {
        heading: "Can I download data from OPS?",
        content: `OPS does not currently support downloading detailed reports. However, you can export raw data from the Agreements Page and Budget Lines page.  If you have ideas for reporting in OPS, please share your feedback by emailing <opre-ops-support@flexion.us>.
        `
    },
    {
        heading: "Does OPS track invoicing?",
        content: `OPS does not currently track invoicing, but it’s on our to-do list. In the future, OPS will track invoices from the payment perspective, but approving will remain in IPP. If you have ideas for invoicing in OPS, please share your feedback by emailing <opre-ops-support@flexion.us>.
`
    },
    {
        heading: "Who changes budget line statuses and when should they do it?",
        content: `It’s up to each team to decide how they will manage their agreements and keep them up to date in OPS. While the Budget Team was responsible for updating OPRE’s legacy system, now team members can make their own updates directly without waiting for someone else to do it for them.

Some teams might assign CORs to request the budget line status changes, but anyone that's listed as a Team Member on the agreement will be able to do it. The most important thing is that each team creates a process and makes sure OPS stays up to date in order to provide a holistic view of OPRE’s budget at all times. Division Directors are the approvers for budget line status changes.

An example of how it could work might look like this:

- In October through December, as Portfolio teams work on research planning, CORs can go into OPS to create new agreements and add budget lines in a Draft Status (you can always edit or delete what doesn’t get included in the actual plans, so feel free to jot down all your ideas and what-ifs directly into OPS)
- In December, after plans are reviewed with OPRE leadership, CORs would go into OPS to request a BL Status Change from Draft to Planned. Once approved by their Division Director, the amounts would be subtracted from the FY Budget
- In February and June, when acquisition plans are typically due from GCS, CORs would go into OPS to request a BL Status Change from Planned to Executing. This would take place whenever you are ready to start the procurement process.
- Finally, once the procurement process is completed and the contract has been awarded, the Budget Team ‘s Award Approval will change the BL Status from Executing to Obligated
- Please note: Contract Modifications will follow the same BL status changes, but a different procurement process
`
    }
];
export default FAQ;
