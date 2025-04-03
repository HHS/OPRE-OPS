import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Accordion from "../../components/UI/Accordion";

const HowToGuides = () => {
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
            <h2 className="margin-bottom-4">How-to Guides</h2>
            <section className="usa-prose">
            {data.map((item) => (
                <Accordion
                    key={item.heading}
                    heading={item.heading}
                    level={3}
                    isClosed={true}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={components}
                    >
                        {item.content}
                    </ReactMarkdown>
                </Accordion>
                ))}
            </section>
        </>
    );
};

// Markdown Guide https://www.markdownguide.org/basic-syntax/
const data = [
    {
        heading: "How to get started in OPS",
        content: `
**What is OPS?**

OPS is the acronym for **O**PRE’s **P**ortfolio **M**anagement **S**ystem. It is a centralized place to plan and track OPRE’s budget and projects across Divisions and Portfolios.

OPS is a custom software application replacing OPRE’s legacy system known as the Management and Accounting of Projects System (MAPS). OPS has been designed using a human-centered design approach where everyday users are active participants in the design and direction of the system. OPS is currently in an early release and will continue to be expanded upon and improved as OPRE is using it. Your feedback is essential in making OPS a successful tool for all, so don’t hesitate to share your thoughts and ideas!

**What benefits does OPS provide?**

**Transparency**

You can view high-level budget, spending and research data for each Portfolio and funding details for every CAN. Changes are tracked via history so you can easily understand who changed what and when.

**Data Visualization**

Budget and spending data can be viewed in diverse and customized ways like across a portfolio, project, or CAN, in addition to the individual agreement level.

**Autonomy**

Team Leaders, CORs and other team members have the ability to create and edit their agreements directly eliminating the need to email the budget team for updates.

**Built-in Approvals**

Division Directors will formally approve budget and status changes in the system rather than through email.

**Real-time Planning**

Plans can be entered into the system as Drafts instead of having to wait until plans are more formalized. This will provide a more holistic view of the data across all stages of planning.
        `
    },
    {
        heading: "How to understand OPS organization",
        content: `
**The portfolio, project, and agreement relationship**

Each OPRE division has one or more portfolios. Within each portfolio, projects can be created to assist in grouping different agreements together. There are different types of agreements which are contracts, grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) and direct obligations.

**Definitions for portfolios, projects and agreements**

- Portfolio - a portfolio is a research entity or funding entity within OPRE
- Project - a project is a body of work composed of agreements that share a common topic or theme (often a research-related agenda or goal)
- Agreement - an agreement is a defined piece of work (possible subset of a broader project), often between OPRE and other contractors

**The agreement lifecycle and budget line statuses**

Budget line statues are used to track the current state of an agreement. There are 5 budget line statuses. All new budget lines start in Draft Status.

| Budget line (BL) Status | Meaning |
|-----------|---------|
| Draft              | BL is in pre-planning, placeholders and what-ifs, not yet solidified |
| Planned            | BL is intended to happen and money can be set aside as planned (even though there might be changes). The dollar amount associated to the budget line will be subtracted from the available FY budget |
| Executing          | BL is in the procurement process, in progress to be formally committed |
| Obligated          | BL is committed in the signed award and can be invoiced against so the work can begin |
| In Review          | BL has pending edits or a pending status change request that needs to be approved or declined |
        `
    },
    {
        heading: "How to understand OPS user roles and access or permissions",
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

- View high-level budget and spending data for all portfolios and CANs
- View research data for all projects and agreements
- View more detailed budget data for your specific projects and agreements
- Create and edit projects [not yet developed, coming soon]
- Create agreements and edit them if listed as a team member
- Request a status change on budget lines for their agreements
- Complete the procurement tracker tasks for their agreements [not yet developed, coming soon]
- Start a contract modification [not yet developed, coming soon]

**Reviewer/Approver**

People with the Reviewer/Approver role are generally Division Directors or Deputy Directors who oversee the budget across their division and portfolios.

Individuals with a reviewer/approver role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit projects
- Create Agreements and edit them if a team member
- Review and approve budget changes for budget lines using CANs within their division
- Review and approve budget line status changes for budget lines using CANs within their division
- Review and approve team member changes for any agreements within their division [not yet developed, coming soon]
- Review and approve the pre-award procurement step for agreements within their division [not yet developed, coming soon]
- Review and approve contract modifications for agreements within their division [not yet developed, coming soon]

**Budget Team**

People on the budget team are responsible for overseeing the budget across OPRE, forecasting trends in spending and budgets, and balancing the budget across external systems.

Individuals with a budget team role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit all projects
- Create agreements and edit them if a team member
- Edit CAN details, FY budget, and update funding received to OPRE
- Review and approve all agreements for the pre-award step of the procurement tracker [not yet developed, coming soon]
  - Review the final consensus memo
  - Submit the requisition and write a check for the total in executing status
- Review and approve all agreements for the award step of the procurement tracker [not yet developed, coming soon]
  - Ensure CLINs entered by CORs match the signed award
  - Review vendor information entered by CORs
  - Review award information entered by CORs
  - Enter the obligated date for budget lines in executing status

**Procurement Team**

People on the procurement team track the procurement process across OPRE and help coordinate between CORs and the procurement shops

Individuals with a procurement team role are able to:

- View all portfolios, projects, agreements and CANs
- Create and edit projects
- Create agreements and edit them if a team member
- View the status of procurement tasks across all agreements [not yet developed, coming soon]
- Reset procurement steps, if needed [not yet developed, coming soon]
        `
    },
    {
        heading: "How to view notifications",
        content: `
[Watch the How-to Video](https://hhsgov.sharepoint.com/:v:/s/OPREPortfoliomanagementSystemOCIO/ESxqsjYhm4JIt_UssPvLgpUByuoXKQZk3YmrGeD8qHwHIQ)
1. Click on the bell icon at the top right corner of the page
1. Any notifications will appear on the right side of the page
        `
    },
    {
        heading: "How to create or edit a portfolio",
        content: `
1. OPS Portfolios are aligned to correspond to OPRE’s research portfolios and organizational chart
    - Portfolios cannot be created or edited in OPS
    - The budget data within each portfolio is updated through each individual CAN within the portfolio
    - The spending data within each portfolio is updated through each individual agreement within the portfolio
        `
    },
    {
        heading: "How to create a project",
        content: `
1. Click Create on the top navigation bar, then click Project
1. Select the project type
    - Research or admin and support
1. Enter a project nickname, title and description
1. When you are done filling out the data, click on the Create Project button
        `
    },
    {
        heading: "How to create an agreement",
        content: `
1. There are 2 ways to create a new agreement
    - Click Agreements in the top navigation bar, then click Add Agreement on the right side of the page
    - __OR__ click Create on the top navigation bar, then click Agreement
1. Complete step 1 by selecting a project the agreement should be associated with and click the Continue button
    - If the agreement needs to be associated with a project that is not listed, click the Add New Project button
    - See How to create a project
1. Complete step 2 by filling out the agreement details and click the Continue button
    - Not all information is required at this stage, and can be completed later if necessary. However, all fields must be filled out before a budget line can be changed from Draft to Planned Status
    - You can click the Save Draft button to save your data entry, exit the agreement creation process, and return to it later, if needed
    - Anyone you add as a Team Member will be able to edit the agreement
        - Make sure you add yourself as a Team Member if you need to edit this agreement in the future [in the future, creators of an agreement will be automatically associated to the agreements they create]
        - Division Directors will be automatically added as Team Members for any agreement using CANs within their Division
        - Team Leaders will be automatically added as Team Members for any agreement using CANs within their Portfolio
1. Complete step 3 by adding service components (SCs) and budget lines (BLs)
    - For Services Components: select the SC# (and whether or not it's optional), add a description, and period of performance and click Add Services Component
    - Edit or delete the services component by hovering over the services component card and clicking the edit or delete icon on the right hand side
    - For Budget Lines: choose the services component the budget line belongs to, add an obligate by date, CAN and amount, and then click Add budget Line
        - A BL ID# will be automatically assigned to each budget line after you create the agreement. This # is just a system reference number
        - The fiscal year (FY) will be auto-populated based on the FY of the obligate by date you enter
        - The Fees will be auto-calculated based on the procurement shop you selected in Step 1
        - The total will be auto-calculated based on the amount + fees
        - All budget lines start in a Draft Status
    - Edit, delete or duplicate the budget line, by hovering over the row and clicking on the edit, delete or duplicate icon on the right hand side
1. If you need to go back to a previous step, click “Back” on the bottom left hand corner (not the browser back button which would exit the process). Your progress in Step 3 will be saved
1. When you are done entering services components and budget lines, click the Create Agreement button
        `
    },
    {
        heading: "How to edit an agreement’s details",
        content: `
1. Navigate to the agreement you want to edit
1. On the Agreement Details tab, click the Edit link on the right side of the page
1. Make your changes
    - Changes to Team Members will require approval if the agreement has at least 1+ budget line in Planned Status
1. When you are done editing, click the Save Changes button
        `
    },
    {
        heading: "How to add a new services component to an agreement",
        content: `
1. Navigate to the agreement you want to add a new services component (SC) to
1. Click on the SCs & Budget Lines tab
1. Click the Edit icon located on right side of the page
1. Review the Edit Services Components section with instructions
1. Select the SC# (and whether or not it's optional), add a description, add a period of performance, and click Add Services Component button
1. If you need to change what you just added, hover over the services component card and click the edit or delete icon on the right hand side
1. When you are done adding services components, scroll to the bottom and click Save Changes
    - Changes to services components will require approval if the agreement has at least 1+ budget line in Planned Status
        `
    },
    {
        heading: "How to edit or delete a services component",
        content: `
1. Navigate to the agreement where you want to edit a services component (SC)
1. Click on the SCs & Budget Lines tab
1. Click the Edit icon on the right side of the page
1. Review the Edit Services Components section with instructions
1. Edit or delete a services component, by hovering over the services component card and clicking the edit or delete icon on the right hand side
1. Make your changes and then click the Update Services Component button
1. When you are done editing services components, scroll to the bottom and click Save Changes
    - Changes to services components will require approval if the agreement has at least 1+ budget line in Planned Status
        `
    },
    {
        heading: "How to add a new budget line to an agreement",
        content: `
1. Navigate to the agreement you want to add a budget line (BL) to
1. Click on the SCs & Budget Lines tab
1. Click the Edit link located on the right side of the page
1. Scroll down to the Edit Budget Lines section
1. Fill out the services component, obligate by date, CAN, amount and notes, as needed
    - All fields will be required once the budget line is in Planned or Executing status
1. Click the Add Budget Line button
    - All new budget lines start in Draft Status and will require approval to change from Draft to Planned Status
    - The BL ID will be referenced as TBD until you click the Save Changes button which is when a BL ID will be assigned by the system
1. When you are done with all changes, click the Save Changes button
        `
    },
    {
        heading: "How to edit or delete a budget line",
        content: `
1. Navigate to the agreement where you want to edit a budget line (BL)
1. Click on the SCs & Budget Lines tab
1. Click the Edit link on the right side of the page
1. Scroll down to the Edit Budget Lines section
1. Edit or delete a budget line, by hovering over the budget line row, and clicking on the edit or delete icon on the right hand side
    - Clicking edit will populate all information that was previously entered for the budget line so it can be altered
1. Make your changes
1. Click on the Update Budget Line button
1. When you are done with all changes, click the Save Changes button
    - Changes to budget lines will require approval if the agreement has at least 1+ budget line in Planned Status
        `
    },
    {
        heading: "How to change a budget line status",
        content: `
1. Navigate to the agreement where you want to change a budget line (BL) status
1. Click on the SCs & Budget Lines tab
1. Scroll to the bottom and click the Request BL Status Change button
1. Resolve any errors, if needed
    - All data will be validated for completeness and required fields will need to be filled out before submitting a status change request
    - Errors will be listed in an alert banner and also display in red text on the page
    - If errors need to be addressed, scroll to the bottom of the page and click the Edit button. This will allow you to fix the errors and return to the Request BL Status Change Page
1. Follow the steps in each section of the Request BL Status Change Page
    - You can optionally close each section when you are finished
1. Review the agreement details to make sure everything looks correct
1. Choose the type of status change you’d like to make
1. Select the budget lines you’d like to apply the status change to
    -  You can select all budget lines within a services component by clicking the first checkbox in the top row (next to BL ID # column)
    -  Turn the After Approval toggle on/off to see how the agreement will change after this status change is approved
1. Review the CANs associated to budget lines you are changing
    - Turn the After Approval toggle on/off to see how the CANs will change after this status change is approved
1. Review changes to confirm what status change you are requesting
1. Add any notes to the reviewer/approver, if needed
1. When you are done making changes, click on the Send to Approval button
    -  This will send a notification to your Division Director who will need to approve the status change before its updated on the agreement
    -  During the review period, budget lines you changed will appear as In Review Status (Budget lines with In Review Status cannot be edited again until the first change has been approved or declined)
1. Check your notifications to see if the request has been approved or declined
    - If changes are declined, review any notes from your Division Director, make updates and re-submit, as needed
        `
    },
    {
        heading: "How to approve or decline budget changes (Approver role only)",
        content: `
1. Navigate to Agreements in the top menu and click the For Review tab
1. Review the budget change cards awaiting your approval
1. There are two ways to approve or decline budget changes
    - Individually by clicking approve or decline on each card
    - __OR__ grouping all budget changes on an agreement by clicking View All
1. If you’d like to approve changes individually, and don’t need to see any additional details about the agreement, click approve or decline on the card
1. If more context is needed or if you’d like to approve multiple changes on an agreement at one time, click on View All
    - Review the steps in each section of the Approval for Budget Change page
        - You can optionally close each section when you are finished
    - Review the agreement details to make sure everything looks correct
    - Review the budget lines that the budget change is related to
        - Turn the After Approval toggle on/off to see how the agreement total will change after this budget change is approved
    - Review the CANs that the budget change is related to
        - Turn the After Approval toggle on/off to see how the CANs will change after this budget change is approved
    - Add any notes to the submitter, if needed
    - If you would like to approve the change(s), check the confirmation box and then click on the Approve Changes button
    - If you would like to decline the change(s), click the Decline button
    - Confirm your decision to approve or decline in the confirmation modal
1. A notification will be sent to the submitter of the budget change and an event will be recorded to the agreement history for the approved or declined budget change
        `
    },
    {
        heading: "How to approve or decline budget line status changes (Approver role only)",
        content: `
1. Navigate to Agreements in the top menu and click the For Review tab
1. Review the status change cards awaiting your approval
1. There are two ways to approve or decline status changes
    - Individually by clicking approve or decline on each card
    - __OR__ grouping all status changes on an agreement by clicking View All
1. If you’d like to approve changes individually, and don’t need to see any additional details about the agreement, click approve or decline on the card
1. If more context is needed or if you’d like to approve multiple changes on an agreement at one time, click on View All
    - Review the steps in each section of the Approval for Status Change page
        - You can optionally close each section when you are finished
    - Review the agreement details to make sure everything looks correct
    - Review the budget lines that the status change is related to
        - Turn the After Approval toggle on/off to see how the agreement total will change after this budget change is approved
    - Review the CANs that the status change is related to
        - Turn the After Approval toggle on/off to see how the CANs will change after this status change is approved (if applicable)
    - Add any notes to the submitter, if needed
    - If you would like to approve the change(s), check the confirmation box and then click on the Approve Changes button
    - If you would like to decline the change(s), click the Decline button
    - Confirm your decision to approve or decline in the confirmation modal
1. A notification will be sent to the submitter of the status change and an event will be recorded to the agreement history for the approved or declined status change
        `
    },
    {
        heading: "How to add a FY budget to a CAN (Budget team only)",
        content: `
1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to add a fiscal year (FY) budget to
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Enter an amount in the CAN’s FY budget input
1. Click the + Add FY Budget button
1. Click the Save Changes button
        `
    },
    {
        heading: "How to edit a FY budget for a CAN (Budget team only)",
        content: `
1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to add a fiscal year (FY) budget to
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Edit the amount in the FY CAN Budget input
1. Click the Update FY Budget button
1. Click the Save Changes button
        `
    },
    {
        heading: "How to add funding received to a CAN (Budget team only)",
        content: `
Funding received means funding received to OPRE towards a CANs FY budget

1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to add funding received to
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Enter an amount in the Funding Received input and any optional notes
1. Click the + Add Funding Received button
1. Review the funding received in the Funding Received YTD table
    - If you need to make changes to the amount you added, hover over the row and click edit or delete
1. When you are done adding funding received, click the Save Changes button
        `
    },
    {
        heading: "How to edit funding received for a CAN (Budget team only)",
        content: `
1. Click on the CANs button in the main navigation
1. Navigate to the CAN you want to edit funding for
1. Click on the CAN Funding tab
1. Click the Edit link on the right side of the page
1. Scroll down to the Funding Received YTD table
1. Hover over the funding received row you would like to edit in the Funding Received YTD table at the bottom of the page
1. On the right side of the row click the edit icon
1. Make changes to the amount in the Funding Received input and notes if applicable
1. Click the Update Funding Received button
1. Click the Save Changes button
        `
    }
];

export default HowToGuides;
