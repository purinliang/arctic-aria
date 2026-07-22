/goal Continuously synchronize all Arctic Aria documentation with the current implemented codebase, preserve unimplemented plans exclusively in the roadmap, and record documentation-only architecture, UI, interaction, and engineering diagnostics.

Repository rules:

* Treat the current code, database schema, migrations, configuration, scripts, tests, assets, and actual repository directory structure as the primary source of truth for the implemented system.
* Work only on the dedicated documentation branch `docs/sync-implementation`.
* If the branch does not exist, create it from the current development branch.
* Do not merge the branch into another branch.
* Do not modify application code under any circumstances.

Allowed changes:

* Markdown documentation files.
* Documentation-specific indexes and navigation files.
* Architecture and directory-structure documentation.
* The existing roadmap document, or one canonical `docs/roadmap.md` if no roadmap currently exists.
* A documentation-only implementation audit or known-issues document if needed to preserve concrete findings without polluting the roadmap.

Forbidden changes:

* Source code.
* Tests.
* Database schemas or migrations.
* Configuration files.
* Package manifests or lockfiles.
* Environment files.
* Build, deployment, CI, or runtime scripts.
* Generated files.
* Code comments.
* Formatting-only changes to non-documentation files.

Primary workflow:

1. Inspect the repository before editing.

   * Read the current documentation structure.
   * Inspect the actual repository directory tree.
   * Inspect implemented routes, layouts, pages, components, hooks, state management, API endpoints, database schema, migrations, authentication, Discord integration, scripts, environment-variable usage, tests, deployment configuration, caching, backup procedures, and user-facing workflows.
   * Build an internal implementation inventory based only on repository evidence.
   * Use the actual code directory structure to determine the current architecture, module boundaries, ownership, nesting relationships, and application surfaces.

2. Compare every relevant documentation claim with the implementation.
   Classify documented content as:

   * currently implemented
   * partially implemented
   * planned but not implemented
   * obsolete or contradicted by the implementation
   * historical context
   * ambiguous and requiring human judgment
   * an observed implementation risk or engineering concern

3. Resolve code-versus-documentation differences according to the following rules.

   A. Documentation is clearly outdated:

   * Update the documentation to match the actual implementation.
   * Correct architecture diagrams, directory trees, module ownership, component nesting, route structure, commands, database fields, environment-variable names, and operational instructions.

   B. Documentation describes planned work that was never implemented:

   * Remove it from current-state documentation.
   * Move the useful plan into the canonical roadmap.
   * Mark it as planned, deferred, under consideration, partially implemented, or unconfirmed as appropriate.

   C. Code and documentation express genuinely conflicting designs or assumptions:

   * Do not silently choose one interpretation.
   * Document what the code currently does.
   * Identify the exact conflicting document, section, claim, or intended design.
   * Explain the practical difference between the implemented state and the documented state.
   * Record the conflict in a documentation-only audit, known-issues section, roadmap item, or clearly labelled conflict note.
   * Do not change the code to resolve the conflict.

   D. The implementation appears incomplete, inconsistent, or potentially incorrect:

   * Document the current observed behavior.
   * Record the suspected issue with supporting repository evidence.
   * Clearly distinguish confirmed behavior from an inferred risk.
   * Do not present an AI diagnosis as a confirmed production bug unless the evidence proves it.

4. Update architecture and directory-structure documentation.

   * Allow architecture documentation and documentation directory organization to be updated based on the actual repository structure.
   * Document the current directory tree at a useful level of detail.
   * Reflect real application boundaries, package boundaries, route groups, shared modules, server-only modules, client-only modules, data-access layers, API surfaces, and deployment surfaces.
   * Remove directory paths and architectural layers that no longer exist.
   * Move proposed but unimplemented directories or architectural layers into the roadmap.
   * Clearly distinguish physical directory structure from conceptual architecture when they differ.
   * Update documentation navigation and document placement when the current documentation hierarchy no longer reflects the actual product architecture.
   * Prefer a small number of authoritative documents over duplicated architecture descriptions.

5. Document the implemented UI precisely.
   Do not limit the review to feature names or screenshots. Record, where relevant:

   * page and route ownership
   * layout structure
   * relative UI position
   * component nesting and containment
   * desktop and mobile differences
   * navigation placement
   * modal, drawer, popover, menu, form, list, card, and panel relationships
   * visual hierarchy
   * spacing and grouping relationships
   * colours and semantic colour usage
   * typography roles
   * disabled, empty, selected, active, focused, hovered, pressed, pending, success, warning, and error states
   * visibility conditions
   * responsive behaviour
   * loading and transition behaviour
   * client-side and server-side rendering boundaries where identifiable

   Describe only states supported by repository evidence. Do not infer visual behaviour solely from component names when implementation details are unavailable.

6. Document user interaction and click behaviour.
   For each important user flow, inspect and record:

   * what the user can click, tap, type, select, drag, confirm, cancel, dismiss, retry, refresh, defer, or delete
   * what state changes immediately after the interaction
   * whether the action waits for the server before updating the UI
   * whether the UI uses optimistic, pessimistic, or mixed update behaviour
   * what loading, pending, disabled, success, failure, rollback, and retry states exist
   * what navigation or focus change occurs
   * whether repeated clicks are prevented
   * whether actions are idempotent
   * whether destructive actions require confirmation
   * what happens after refresh, route change, reconnect, or server failure
   * whether client state and persisted server state can diverge
   * whether mobile and desktop interaction behaviour differs

7. Perform documentation-only engineering diagnostics.
   While inspecting the code, record relevant implementation risks and missing states, including but not limited to:

   * missing loading states
   * missing pending or disabled states
   * missing empty, error, retry, or rollback states
   * interactions that may benefit from optimistic updates
   * optimistic updates without safe rollback
   * duplicate submissions or repeated-click risks
   * possible race conditions
   * possible concurrency conflicts
   * lost-update risks
   * stale-response ordering problems
   * a server response potentially overwriting newer client settings
   * client state potentially overwriting newer server state
   * inconsistent cache invalidation
   * incorrect, missing, or inconsistent cache-expiry rules
   * inconsistent revalidation behaviour
   * cache keys that may not represent all relevant state
   * stale data after mutation
   * cross-tab or cross-device synchronization gaps
   * inconsistent handling of reconnects
   * partial failures across multi-step actions
   * missing transaction boundaries
   * non-atomic updates
   * inconsistent validation between client and server
   * insufficient ownership checks
   * unclear error diagnostics
   * missing accessibility states or keyboard interactions
   * UI states that exist visually but are not connected to real behaviour
   * implemented behaviour that is not documented
   * documented behaviour that is not reachable in the UI

   Diagnostic requirements:

   * Do not modify code to fix any finding.
   * Record the exact relevant paths, components, functions, routes, or data flows.
   * Separate confirmed issues from possible risks.
   * Include a short explanation of the failure scenario.
   * Include the likely user-visible consequence.
   * Include the expected or safer behaviour where reasonably clear.
   * Avoid speculative claims unsupported by code evidence.
   * Do not assign arbitrary severity labels without explaining the impact.
   * Consolidate duplicate findings that share the same root cause.

8. Maintain a clear documentation classification.

   Current-state documentation:

   * Describes only what is implemented now.
   * May mention a known limitation when necessary to explain current behaviour.
   * Must not present future plans as current features.

   Roadmap:

   * Contains useful planned but unimplemented work.
   * Contains intentionally deferred work.
   * May contain proposed fixes or improvements derived from confirmed diagnostics.
   * Must distinguish committed plans from suggestions and unconfirmed ideas.

   Implementation audit or known issues:

   * Contains observed mismatches, risks, inconsistencies, and unresolved conflicts.
   * Records both the actual implemented behaviour and the conflicting expectation.
   * Separates confirmed problems from AI-inferred concerns.
   * Must not imply that an issue has been fixed.

   Historical records:

   * Preserve useful design decisions, release notes, investigations, and previous architectural plans.
   * Must be clearly labelled historical.
   * Must link to current authoritative documentation where appropriate.

9. Update current-state documentation.

   * Rewrite implemented-feature descriptions to match the code precisely.
   * Correct stale commands, paths, environment-variable names, architecture descriptions, database fields, feature names, version claims, UI behaviour, and deployment instructions.
   * Remove duplicated or contradictory current-state descriptions.
   * Use consistent Arctic Aria terminology across all documents.
   * Do not claim that a feature exists unless repository evidence confirms it.
   * Do not describe intended architecture as current architecture.
   * Do not simplify away important implementation limitations.

10. Move unimplemented plans into the roadmap.

* Any feature, workflow, architectural plan, integration, command, directory, field, automation, UI state, or behaviour described as current but not found in the code must be removed from current-state documentation.
* Preserve useful planned work by moving it into the canonical roadmap.
* Do not silently delete meaningful product plans.
* Consolidate duplicate roadmap items.
* Clearly distinguish:

  * planned
  * partially implemented
  * deferred
  * under consideration
  * suggested from implementation diagnostics
  * unconfirmed or historical
* Do not invent priorities, deadlines, owners, release versions, or implementation details that are not already supported.
* If it is unclear whether an item is still desired, place it under an “Unconfirmed or historical plans” section rather than presenting it as committed work.

11. Preserve historical records appropriately.

* Keep useful architecture decisions, release notes, investigations, benchmarks, and historical design documents.
* Clearly label historical documents so they cannot be mistaken for current system documentation.
* Add links to the current authoritative documentation where appropriate.
* Do not rewrite historical records to pretend they always described the current implementation.

12. Improve documentation structure without expanding product scope.

* Establish a clear distinction between:

  * current product documentation
  * UI and interaction documentation
  * development and operations documentation
  * architecture and directory-structure documentation
  * implementation diagnostics and known issues
  * historical records
  * roadmap
* Prefer consolidating and correcting existing files over creating many new files.
* Ensure README.md provides an accurate overview and links to authoritative detailed documents.
* Avoid unnecessary prose, speculative explanations, marketing language, and repeated descriptions.
* Documentation may be reorganized when the existing directory structure no longer supports clear ownership or navigation.
* Do not reorganize application code to match the documentation.

Continuous verification loop:

* After each substantial documentation update, inspect the relevant implementation again.
* Search the entire repository for related terminology, commands, paths, environment variables, feature names, database identifiers, UI states, interactions, cache rules, and previous descriptions.
* Recheck actual directory structure after documentation reorganization.
* Verify important user interactions from trigger to client state, request, server handling, persistence, response, cache update, and final UI state.
* Continue comparing, correcting, consolidating, documenting conflicts, and rechecking until a complete repository-wide pass finds no material undocumented mismatch that can be established from repository evidence.
* Do not stop after updating only README.md or a small subset of documents.
* Do not make edits merely to consume time or tokens.
* Every documentation change must resolve an identified inaccuracy, contradiction, omission, duplication, classification problem, diagnostic finding, architecture mismatch, or navigation problem.

Required final verification:

* Confirm that `git diff --name-only` contains documentation files only.
* If any non-documentation file was modified, revert it before completing the goal.
* Confirm the current branch is `docs/sync-implementation`.
* Search for stale environment-variable names.
* Search for obsolete commands and repository paths.
* Search for obsolete directory trees and architecture descriptions.
* Search for features described as implemented but absent from the code.
* Search for planned features that still appear in current-state documentation.
* Search for user interactions described incorrectly or incompletely.
* Search for important UI actions without documented loading, pending, error, or persistence behaviour.
* Search for duplicate or contradictory roadmap entries.
* Search for diagnostic findings duplicated across roadmap, audit, and current-state documents.
* Check internal documentation links where practical.
* Run documentation-specific validation commands if they already exist, but do not modify code or configuration to make them pass.
* Leave the documentation branch ready for human review and do not merge it.

Completion criteria:

* Current-state documentation accurately reflects the current codebase and actual directory structure.
* Architecture documentation matches the implemented repository boundaries.
* Documentation structure clearly separates current behaviour, roadmap, diagnostics, and history.
* Important UI structure, colours, nesting, interaction states, and click behaviour are documented where supported by code evidence.
* Unimplemented but still useful plans exist only in the canonical roadmap or clearly labelled historical records.
* Partially implemented functionality is described honestly and precisely.
* Confirmed code-versus-documentation conflicts are recorded with both sides clearly identified.
* Potential engineering risks are recorded as diagnostics without being falsely presented as confirmed bugs.
* Obsolete claims are removed or labelled historical.
* Terminology is consistent.
* Documentation navigation is clear.
* No source code, configuration, schema, test, script, or generated file has been changed.
* A final repository-wide verification pass finds no known material documentation-versus-code mismatch that can be resolved through documentation alone.

When the goal is complete, provide:

* a concise list of documents updated, created, moved, or consolidated
* architecture and directory-structure changes reflected in documentation
* the major code-versus-documentation mismatches corrected
* the plans moved into the roadmap
* confirmed conflicts recorded without resolution
* important UI and interaction behaviour documented
* confirmed engineering issues recorded
* possible risks or AI-derived diagnostics recorded separately
* ambiguous items placed under unconfirmed plans or human-review notes
* the verification performed
* any remaining uncertainties requiring human judgment

Do not propose or implement new product features in code. Do not fix code when documentation reveals a bug or risk. Record the actual behaviour, evidence, expected behaviour, and possible remediation direction in documentation only, then continue the synchronization process.
