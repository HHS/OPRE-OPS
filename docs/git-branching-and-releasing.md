# OPRE-OPS Branching Strategy

The OPRE Team currently uses the following branching strategy:
### main
* `main` is the default and primary branch. This will always be the most up-to-date released code base.
* `main` currently has branch protections in place, and requires a `pull request` with at least `2` approvals from someone on the `dev team`.

### Feature Branches
* Features should branch from `main` and utilize a naming format of `OPS-{Issue#}/{Feature_Name}`, example: `OPS-522/CAN_Details_Page`.

```mermaid
---
title: OPRE-OPS Git Branching
---
%%{init: {'gitGraph': {'showBranches': true, 'showCommitLabel':true,'mainBranchOrder': 4}} }%%
gitGraph
   commit id: "initial commit"
   commit
   branch OPS-5xx/New_Feature_A
   checkout OPS-5xx/New_Feature_A
   commit
   commit
   checkout main
   merge OPS-5xx/New_Feature_A
   checkout main
   commit
   branch OPS-6xx/New_Feature_B
   checkout OPS-6xx/New_Feature_B
   commit
   commit
   commit
   checkout main
   merge OPS-6xx/New_Feature_B
```

# OPRE-OPS Release Strategy

The OPRE Team currently uses the following release strategy:

- When a PR is merged to `main` the GitHub Action `release.yml` will automatically create a new release in
GitHub with next version number.
- The `main` branch will be tagged with the new version number.
- The release will be published to the [GitHub Releases page](https://github.com/HHS/OPRE-OPS/releases).
