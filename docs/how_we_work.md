# How We Work: Engineering team practices & norms

*Eng team*: @carjug, @amymok, @alexsoble

*Version*: Draft, ~V0.9

## Engineering team practices

### We will review each other’s code. 
* *What*: 	All code will be code reviewed and approved by at least one other team member before it is accepted and merged.  (Exception: typos, spelling fixes.) We will prioritize reviewing each other’s code and unblocking teammates above our own software development work. 
* *Why*:	Code review will increase the quality and security of our work. Code review will also increase the resiliency of our team. All code will be well-understood by multiple teammates, making it easier to improve and change. 

### We will strive for kindness, honesty, and open-mindedness in code review.
* *What*:	Try not to assume what your teammate knows or doesn’t know; ask open-ended questions when possible in order to learn as you review. Don’t hold back from sharing your ideas and opinions—we want to hear from each other and incorporate each other’s ideas! See [Code Review](https://engineering.18f.gov/code-review/) in the TTS Engineering Practices Guide for more suggestions and best practices.  
* *Why*:  	Being honest and open with our questions and ideas during code review will improve the quality of the work. Expressing our ideas thoughtfully and kindly will help others hear our ideas.

### We will embrace automated testing, continuous integration, and continuous deployment.
* *What*:	As a rule of thumb, when we add new code to the project, we will write new tests covering the new code. Each new pull request will trigger automated testing. Once we have built out our continuous deployment pipeline, accepting and merging pull requests will trigger automatic deploys.
* *Why*:  	Having automated testing and continuous integration will ensure the new work will be able to integrate well and does not break previous work. We also want to continuously improve and maintain the quality of the codebase. These best practices are considered [standard](https://engineering.18f.gov/workflow/) for new TTS coding projects. 

### We will aim for excellent documentation and highly-readable code. 
* *What*:	We will use inline documentation in the form of docstrings and comments for complicated logic. We will use GitHub source control for code-level documentation and will add to the documentation as needed for new code as appropriate.
* *Why*:	Keeping the code readable and the documentation up-to-date allows for others who are new to the project to understand the code and have the most current information so that they can get up to speed quickly.

### We will share our work-in-progress. 
* *What*:	We will use features like [Draft Pull Requests](https://github.blog/2019-02-14-introducing-draft-pull-requests/) in GitHub to share work-in-progress sooner rather than later, especially for long-running or tricky work.
* *Why*:	Sharing work-in-progress will make it easier for us to follow each other’s work, facilitate better code review, and help us avoid surprises.

### We will aim for small, focused Pull Requests that map to issues in our backlog. 
* *What*:	We will write each pull request to accomplish one small, cohesive change. This change will map back to an issue for reference. We will include a link to the associated issue for each pull request. We may need more than one pull request to implement a given issue.
* *Why*:	Small and focused pull requests will make code review faster and easier.  If there’s a need to roll back a change, it can also be done more easily if we do not have a big change or many different changes in a pull request.  By mapping pull requests back to issues, it can help the team track our progress on our work.

## Engineering team roles

### Tech Lead role

Amy Mok will act as our Tech Lead for this project, with backup support from Alex Soble and Carly Jugler.

### Table of responsibilities

Task/Responsibility | Primary | Backup
-- | -- | --
Keep tabs on the different eng streams and whether they’re flowing smoothly individually and together<br>
Ensure engs have a good sense of their roles; eng team roles/shape matched to the work that needs doing | AM | ARS
Meet with PM to provide initial perspective on draft milestones, cycles, stories | AM | CJ
Meet with OCIO to represent project, fill out ATO docs** | ARS | AM, CJ
Guide eng team to technical decisions | ARS | AM, CJ
Implementation — back end | CJ | AM
Implementation — front end | ARS | CJ
Implementation — database migration** | AM | CJ
(TBD) Train up partner tech lead |   |  


**this is a big effort!

## Git flow practices

We will use git flow practices to organize our work. [GitHub flow](https://guides.github.com/introduction/flow/) is one lightweight example.

Our git flow practices: 

* We will checkout a branch from the main branch when starting on a new issue. 
* In the branch name, we will include our initials and a reference to the issue number; this will help others put our work in context. 
* We will adopt a consistent naming pattern for branches, such as `cj/25/feature-name`, `cj-25-feature-name`, or the like.
* We will use commits to encapsulate separate units of work and write clear commit messages that explain the associated changes.
* Once a PR has been reviewed and approved, we will merge it into a `test` or `staging` branch for further testing. 
* After testing passes, we will merge those changes to `main`.
* As we build out our continuous deployment pipeline, merges to branches like `test`, `staging`, and `main` will trigger automated deploys to the appropriate testing, staging, and production applications.
* We will delete branches as they are merged to keep the repository clean and orderly.
