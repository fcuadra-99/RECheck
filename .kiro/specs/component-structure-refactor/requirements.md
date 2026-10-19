# Requirements Document

## Introduction

This feature covers the audit, extraction, deduplication, and reorganization of React/TypeScript components in the project. The codebase has accumulated several structural issues: page files contain large inline sub-components that should be standalone, near-identical components exist in parallel (e.g., two `DataTableColumnHeader` files, two `Dashboard` pages with ~95% shared code, two sidebar components, two breadcrumb components), and the `src/components/parts/` directory mixes unrelated concerns. The goal is to improve maintainability, reusability, and discoverability without changing any visible behavior.

## Glossary

- **Refactor_Tool**: The developer tooling and process used to perform the refactoring (IDE, TypeScript compiler, linter).
- **Page_Component**: A React component living under `src/pages/` that maps to a route in `App.tsx`.
- **Inline_Component**: A React component defined inside a Page_Component file rather than in its own file.
- **Shared_Component**: A reusable React component that is consumed by two or more Page_Components or other Shared_Components.
- **Parts_Directory**: The directory `src/components/parts/` that holds Shared_Components.
- **Duplicate_Component**: Two or more component files that export functionally identical or near-identical components.
- **Dead_Component**: A component file that is not imported anywhere in the codebase.
- **Canonical_Component**: The single authoritative file that remains after merging Duplicate_Components.
- **Import_Reference**: Any `import` statement in a `.tsx` or `.ts` file that references a component by path.

---

## Requirements

### Requirement 1: Audit Inline Components in Page Files

**User Story:** As a developer, I want to identify all Inline_Components defined inside Page_Component files, so that I know what needs to be extracted.

#### Acceptance Criteria

1. THE Refactor_Tool SHALL produce a list of every Inline_Component found inside `src/pages/**/*.tsx` files, including the file path and component name.
2. WHEN an Inline_Component is used only within its parent Page_Component file, THE Refactor_Tool SHALL flag it as a candidate for extraction.
3. WHEN an Inline_Component is used in two or more Page_Component files, THE Refactor_Tool SHALL flag it as a candidate for promotion to a Shared_Component.
4. THE Refactor_Tool SHALL report the total count of Inline_Components found across all Page_Component files.

---

### Requirement 2: Extract Inline Components into Standalone Files

**User Story:** As a developer, I want each Inline_Component moved to its own file, so that components are independently importable and testable.

#### Acceptance Criteria

1. WHEN an Inline_Component is extracted, THE Refactor_Tool SHALL create a new `.tsx` file for it under `src/components/parts/` or a relevant subdirectory.
2. WHEN an Inline_Component is extracted, THE Refactor_Tool SHALL update all Import_References in the original Page_Component file to point to the new file path.
3. WHEN an Inline_Component is extracted, THE Refactor_Tool SHALL remove the original inline definition from the Page_Component file.
4. AFTER extraction, THE Refactor_Tool SHALL verify that the TypeScript compiler reports zero new type errors compared to before the extraction.
5. THE Refactor_Tool SHALL preserve the component's props interface and display name exactly as they were before extraction.

---

### Requirement 3: Identify Duplicate Components

**User Story:** As a developer, I want to find all Duplicate_Components in the codebase, so that I can eliminate redundancy.

#### Acceptance Criteria

1. THE Refactor_Tool SHALL compare all component files in `src/components/parts/` and `src/pages/` and report pairs or groups that export functionally equivalent components.
2. THE Refactor_Tool SHALL specifically identify the following known duplicates:
   a. `src/components/parts/data-col-headr.tsx` and `src/components/parts/data-column-header.tsx` (identical `DataTableColumnHeader` export).
   b. `src/pages/researcher/Dashboard.tsx` and `src/pages/staff/Dashboard.tsx` (near-identical `AnnouncementsPage` component with only minor stat-query differences).
   c. `src/components/parts/app-sidebar.tsx` (uses static `DATA` object) and `src/components/parts/neo-sidebar.tsx` (active sidebar with dynamic role-based nav and auth).
   d. `src/components/parts/app-breadcrumb.tsx` (auto-generates breadcrumbs from URL) and `src/components/parts/breadcrumbs.tsx` (accepts explicit breadcrumb items as props).
3. THE Refactor_Tool SHALL report which of each duplicate pair is currently imported and used in the application.

---

### Requirement 4: Merge Duplicate Components into Canonical Components

**User Story:** As a developer, I want Duplicate_Components merged into a single Canonical_Component, so that fixes and changes only need to be made in one place.

#### Acceptance Criteria

1. WHEN two components are merged, THE Refactor_Tool SHALL designate one file as the Canonical_Component and delete the other.
2. WHEN merging `data-col-headr.tsx` and `data-column-header.tsx`, THE Canonical_Component SHALL be `src/components/parts/data-column-header.tsx` and `data-col-headr.tsx` SHALL be deleted.
3. WHEN merging the two Dashboard components, THE Refactor_Tool SHALL extract the shared announcement and layout logic into a single `src/components/parts/dashboard/AnnouncementsPage.tsx` component that accepts a `statsLoader` prop of type `() => Promise<{ total: number; pending: number; completed: number }>`, allowing each role-specific page to supply its own stat-fetching logic.
4. WHEN merging sidebar components, THE Canonical_Component SHALL be `src/components/parts/neo-sidebar.tsx` (the active, role-aware sidebar) and `src/components/parts/app-sidebar.tsx`
 SHALL be deleted.
5. WHEN merging breadcrumb components, THE Canonical_Component SHALL be `src/components/parts/app-breadcrumb.tsx` (the auto-URL version used in the layout) and `src/components/parts/breadcrumbs.tsx` SHALL be evaluated for retention as a separate explicit-props variant only if it has active Import_References outside of `app-breadcrumb.tsx`.
6. AFTER merging, THE Refactor_Tool SHALL update all Import_References across the codebase to point to the Canonical_Component.
7. AFTER merging, THE Refactor_Tool SHALL verify that the TypeScript compiler reports zero new type errors.

---

### Requirement 5: Identify and Remove Dead Components

**User Story:** As a developer, I want Dead_Components removed from the codebase, so that the component inventory only contains files that are actually used.

#### Acceptance Criteria

1. THE Refactor_Tool SHALL scan all `.tsx` and `.ts` files under `src/` and report any component file that has zero Import_References from other files.
2. WHEN a Dead_Component is confirmed (no Import_References and not a route-level Page_Component registered in `App.tsx`), THE Refactor_Tool SHALL delete the file.
3. THE Refactor_Tool SHALL specifically evaluate `src/pages/Testa.tsx`, `src/pages/Testb.tsx`, `src/pages/Test.tsx`, `src/pages/researcher/FormsTemplates copy.tsx`, and `src/components/parts/app-sidebar.tsx` as Dead_Component candidates.
4. AFTER deletion, THE Refactor_Tool SHALL verify that the TypeScript compiler reports zero new type errors.

---

### Requirement 6: Reorganize the Parts Directory

**User Story:** As a developer, I want `src/components/parts/` organized into logical subdirectories, so that related components are grouped and easy to find.

#### Acceptance Criteria

1. THE Refactor_Tool SHALL group components in `src/components/parts/` into subdirectories by concern: `table/` for table-related components (column header, pagination, data-table), `navigation/` for sidebar and breadcrumb components, `forms/` for form components (login-form, signup-form, reset), `dashboard/` for dashboard-specific components, and `dialogs/` for dialog/modal components.
2. WHEN a component is moved to a subdirectory, THE Refactor_Tool SHALL update all Import_References across the codebase to use the new path.
3. WHEN a component is moved, THE Refactor_Tool SHALL not rename the exported component symbol — only the file path changes.
4. AFTER reorganization, THE Refactor_Tool SHALL verify that the TypeScript compiler reports zero new type errors.
5. THE Refactor_Tool SHALL preserve the existing `src/components/parts/proposals/` subdirectory structure.

---

### Requirement 7: Preserve Runtime Behavior

**User Story:** As a developer, I want all refactoring changes to be behavior-preserving, so that no user-visible functionality is broken.

#### Acceptance Criteria

1. AFTER all refactoring steps are complete, THE Refactor_Tool SHALL confirm that all existing routes defined in `App.tsx` resolve to a valid component.
2. AFTER all refactoring steps are complete, THE Refactor_Tool SHALL confirm that the application builds without errors using `tsc -b && vite build`.
3. WHEN a component is extracted or merged, THE Refactor_Tool SHALL preserve all props, state, side effects, and event handlers of the original component.
4. IF a component uses a named export, THEN THE Refactor_Tool SHALL preserve the named export in the Canonical_Component file.
5. IF a component uses a default export, THEN THE Refactor_Tool SHALL preserve the default export in the Canonical_Component file.

---

### Requirement 8: Maintain TypeScript Type Safety

**User Story:** As a developer, I want all refactored components to remain fully typed, so that the TypeScript compiler continues to catch type errors.

#### Acceptance Criteria

1. THE Refactor_Tool SHALL not use `any` types in newly created or modified component files unless the original component already used `any` at that location.
2. WHEN extracting an Inline_Component, THE Refactor_Tool SHALL move its props interface or type alias to the new file alongside the component.
3. WHEN merging two components with differing prop types, THE Refactor_Tool SHALL define a unified props interface that satisfies both original usages without widening types unnecessarily.
4. AFTER all changes, THE Refactor_Tool SHALL confirm that `tsc --noEmit` exits with code 0.
