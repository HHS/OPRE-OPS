# OPRE-OPS Branching Strategy

The OPRE Team currently uses the following branching strategy:
### main
* `main` is the default and primary branch. This will always be the most up-to-date released code base.
* `main` currently has branch protections in place, and requires a `pull request` with at least `1` approval from someone on the `dev team`.

### Release Branches
* `development`, `staging`, `production` are reserved branches cooresponding the their respective release environments. Any commit will trigger a release to that specific environment (Space) within Cloud.gov.
* If you want to Cloud.gov, simply `push` to one of the environment branches. You should follow the standard progression though of `development` --> `staging` --> `production`. 
* `staging` and `production` will have protections in place ensuring a release was processed to their lower tier environments prior to allowing a `push`.

### Feature Branches
* Features should branch from `main` and utilize a naming format of `OPS-{Issue#}_{Feature_Name}`, example: `OPS-522_CAN_Details_Page`.
* During colaboration, it's okay to branch from someone else's branch instead of `main`.
* Always try to do new work in a feature branch, avoid using generic branches like `tim_custom_testing_branch`. Keep branches specific to a feature or subset of changes.

```mermaid
%%{init: {'gitGraph': {'showBranches': true, 'showCommitLabel':true,'mainBranchOrder': 4}} }%%
gitGraph;
   commit id: "initial commit";
   commit;
   branch OPS-5xx_New_Feature_A order: 5;
   checkout OPS-5xx_New_Feature_A;
   commit;
   commit;
   checkout main;
   merge OPS-5xx_New_Feature_A;
   commit id: "release" tag: "v1.0.3";
   branch development order: 3;
   checkout development;
   commit id: "dev release" type: HIGHLIGHT;
   branch staging order: 2
   checkout staging
   commit id: "staging release" type: HIGHLIGHT
   branch production order: 1
   checkout production
   commit id: "prod release" type: HIGHLIGHT
   checkout main
   commit
   branch OPS-6xx_New_Feature_B order: 6
   checkout OPS-6xx_New_Feature_B
   commit
   commit
   commit
   checkout development
   merge OPS-6xx_New_Feature_B id: "dev preview"
   checkout main
   merge OPS-6xx_New_Feature_B
   commit id: "release" tag: "v1.0.4"   
```
