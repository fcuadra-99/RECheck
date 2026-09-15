# Implementation Plan: Component Structure Refactor

## Overview

Sequential structural refactor across 7 phases. Each phase ends with a `tsc --noEmit` verification. No runtime behavior changes. All tasks are coding-only.

## Tasks

- [x] 1. Phase 1 — Delete dead files and remove test routes
  - [x] 1.1 Delete `src/pages/Testa.tsx`, `src/pages/Testb.tsx`, `src/pages/Test.tsx`, and `src/pages/researcher/FormsTemplates copy.tsx`
    - These files have zero active import references outside of App.tsx route stubs
    - _Requirements: 5.2, 5.3_
  - [x] 1.2 Delete `src/app/Layout.tsx` and `src/components/parts/app-sidebar.tsx`
    - `Layout.tsx` has no importers; `app-sidebar.tsx` is only imported by the dead `Layout.tsx`
    - _Requirements: 5.2, 4.4_
  - [x] 1.3 Remove `Testa` and `Testb` imports and their route entries (`/sdevi/sub1`, `/sdevi/sub2`) from `src/App.tsx`
    - Verify no navigation links in the active UI point to these paths before removing
    - _Requirements: 5.2, 7.1_
  - [x] 1.4 Run `tsc --noEmit` and confirm exit code 0
    - _Requirements: 5.4, 7.2, 8.4_

- [x] 2. Phase 2 — Merge identical DataTableColumnHeader
  - [x] 2.1 Delete `src/components/parts/data-col-headr.tsx` (non-canonical duplicate)
    - `data-column-header.tsx` is the canonical file; both are byte-for-byte identical
    - _Requirements: 4.1, 4.2_
  - [x] 2.2 Search for any `import` statements referencing `data-col-headr` across `src/` and update them to point to `data-column-header.tsx`
    - _Requirements: 4.6_
  - [x] 2.3 Run `tsc --noEmit` and confirm exit code 0
    - _Requirements: 4.7, 7.2_

- [x] 3. Phase 3 — Extract shared Dashboard into AnnouncementsPage
  - [x] 3.1 Create `src/components/parts/dashboard/AnnouncementsPage.tsx` with the `DashboardStats`, `StatsLoader`, and `AnnouncementsPageProps` interfaces as defined in the design, and move the shared announcement/layout logic from `researcher/Dashboard.tsx` into it
    - Accept `statsLoader: StatsLoader` as a required prop (no default) so TypeScript enforces it at compile time
    - _Requirements: 4.3, 2.1, 2.5, 8.2, 8.3_
  - [x] 3.2 Write unit tests for `AnnouncementsPage`
    - Test renders correctly when given a mock `statsLoader` that resolves immediately
    - Test renders loading skeleton when `statsLoader` is pending
    - _Requirements: 2.4_
  - [x] 3.3 Refactor `src/pages/researcher/Dashboard.tsx` to a thin wrapper that defines `researcherStatsLoader` and renders `<AnnouncementsPage statsLoader={researcherStatsLoader} />`
    - Researcher loader queries `proposals` table for total/pending/completed counts directly
    - _Requirements: 4.3, 7.3_
  - [x] 3.4 Refactor `src/pages/staff/Dashboard.tsx` to a thin wrapper that defines `staffStatsLoader` and renders `<AnnouncementsPage statsLoader={staffStatsLoader} />`
    - Staff loader queries `proposals` for total, `final_reports` for completed, derives pending as `total - completed`
    - _Requirements: 4.3, 7.3_
  - [x] 3.5 Run `tsc --noEmit` and confirm exit code 0
    - _Requirements: 2.4, 4.7, 7.2_

- [x] 4. Phase 4 — Merge breadcrumb duplicate
  - [x] 4.1 Verify `src/components/parts/breadcrumbs.tsx` has zero active import references outside of `app-breadcrumb.tsx`, then delete it
    - `app-breadcrumb.tsx` is the canonical breadcrumb component used in the layout
    - _Requirements: 4.5, 5.1, 5.2_
  - [x] 4.2 Run `tsc --noEmit` and confirm exit code 0
    - _Requirements: 4.7, 7.2_

- [x] 5. Phase 5 — Extract inline components from Profile.tsx
  - [x] 5.1 Extract the `Detail` component from `src/pages/Profile.tsx` into `src/components/parts/forms/Detail.tsx`, preserving its props interface and all logic exactly
    - _Requirements: 2.1, 2.3, 2.5, 8.2_
  - [x] 5.2 Extract the `EditAccountForm` component from `src/pages/Profile.tsx` into `src/components/parts/forms/EditAccountForm.tsx`, preserving its props interface and all logic exactly
    - _Requirements: 2.1, 2.3, 2.5, 8.2_
  - [x] 5.3 Extract the `AvatarUpload` component from `src/pages/Profile.tsx` into `src/components/parts/forms/AvatarUpload.tsx`, preserving its props interface and all logic exactly
    - _Requirements: 2.1, 2.3, 2.5, 8.2_
  - [x] 5.4 Extract the `ChangePasswordForm` component from `src/pages/Profile.tsx` into `src/components/parts/forms/ChangePasswordForm.tsx`, preserving its props interface and all logic exactly
    - Note: a near-duplicate `ChangePasswordForm` exists in `signu-form.tsx`; do not merge at this stage — extract only
    - _Requirements: 2.1, 2.3, 2.5, 8.2_
  - [x] 5.5 Update `src/pages/Profile.tsx` to import all four extracted components from their new paths and remove the original inline definitions
    - _Requirements: 2.2, 2.3_
  - [x] 5.6 Run `tsc --noEmit` and confirm exit code 0
    - _Requirements: 2.4, 7.2_

- [x] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 7. Phase 6 — Reorganize parts directory
  - [x] 7.1 Move navigation components to `src/components/parts/navigation/`
    - Move `neo-sidebar.tsx` → `navigation/neo-sidebar.tsx`
    - Move `app-breadcrumb.tsx` → `navigation/app-breadcrumb.tsx`
    - _Requirements: 6.1, 6.3_
  - [x] 7.2 Move table components to `src/components/parts/table/`
    - Move `data-column-header.tsx` → `table/data-column-header.tsx`
    - Move `pagination.tsx` → `table/pagination.tsx`
    - _Requirements: 6.1, 6.3_
  - [x] 7.3 Move form components to `src/components/parts/forms/`
    - Move `login-form.tsx` → `forms/login-form.tsx`
    - Move `signu-form.tsx` → `forms/signu-form.tsx`
    - Move `reset.tsx` → `forms/reset.tsx`
    - The four extracted Profile components from Phase 5 are already in `forms/`
    - _Requirements: 6.1, 6.3_
  - [x] 7.4 Move dashboard components to `src/components/parts/dashboard/`
    - Move `chart-line-multi.tsx` → `dashboard/chart-line-multi.tsx`
    - `AnnouncementsPage.tsx` is already in `dashboard/` from Phase 3
    - _Requirements: 6.1, 6.3_
  - [x] 7.5 Move dialog components to `src/components/parts/dialogs/`
    - Move `dialogue.tsx` → `dialogs/dialogue.tsx`
    - _Requirements: 6.1, 6.3_
  - [x] 7.6 Update all import references across `src/` to use the new paths for every moved file
    - Do not rename any exported component symbols — only file paths change
    - Verify `src/components/parts/proposals/` subdirectory is left untouched
    - _Requirements: 6.2, 6.3, 6.5_
  - [x] 7.7 Run `tsc --noEmit` and confirm exit code 0
    - _Requirements: 6.4, 7.2, 8.4_

- [ ] 8. Phase 7 — Property-based tests
  - [x] 8.1 Install `fast-check` as a dev dependency and configure it for use with Vitest
    - Add to `package.json` devDependencies; no additional config file needed for Vitest integration
    - _Requirements: 7.2, 8.4_
  - [x] 8.2 Write property test for Property 1: No stale import paths remain
    - Parse all `.ts`/`.tsx` files under `src/`, extract import paths, resolve each against the filesystem, assert all exist
    - Feature: component-structure-refactor, Property 1
    - Validates: Requirements 4.6, 6.2
  - [x] 8.3 Write property test for Property 2: Exported component symbols are preserved
    - Snapshot export names of each canonical component file; assert snapshots match expected set
    - Feature: component-structure-refactor, Property 2
    - Validates: Requirements 7.4, 7.5
  - [x] 8.4 Write property test for Property 3: Props interfaces are preserved through extraction and merge
    - Assert `tsc --noEmit` exits 0 (TypeScript structural checking enforces this); supplement with runtime prop-shape assertions for extracted components
    - Feature: component-structure-refactor, Property 3
    - Validates: Requirements 2.5, 7.3, 8.3
  - [x] 8.5 Write property test for Property 4: All App.tsx routes resolve to existing components
    - Parse `App.tsx` import declarations, assert each referenced file exists and exports the expected symbol
    - Feature: component-structure-refactor, Property 4
    - Validates: Requirements 7.1
  - [x] 8.6 Write property test for Property 5: No new `any` types introduced
    - Use fast-check to generate file paths from the modified set; grep for `any` annotations; compare counts to pre-refactor baseline stored as a fixture
    - Feature: component-structure-refactor, Property 5
    - Validates: Requirements 8.1
  - [x] 8.7 Write property test for Property 6: Moved components exist at new paths with unchanged export names
    - Define the expected old→new path mapping as a record; assert each new path exists and exports the same symbol name
    - Feature: component-structure-refactor, Property 6
    - Validates: Requirements 6.1, 6.3
  - [x] 8.8 Write property test for Property 7: TypeScript compiler reports zero errors
    - Shell out to `tsc --noEmit` and assert exit code 0
    - Feature: component-structure-refactor, Property 7
    - Validates: Requirements 2.4, 4.7, 5.4, 6.4, 7.2, 8.4
  - [x] 8.9 Run `vitest --run` and confirm all property tests pass
    - _Requirements: 7.2, 8.4_

- [x] 9. Phase 8 — Enforce modularity across all components
  - [x] 9.1 Create barrel `index.ts` files for each subdirectory in `src/components/parts/`
    - `navigation/index.ts` — re-exports `AppBreadcrumb` and `NeoSidebar`
    - `table/index.ts` — re-exports `DataTableColumnHeader` and `Pagination`
    - `forms/index.ts` — re-exports `LoginForm`, `SignupForm`, `Reset`, `Detail`, `EditAccountForm`, `AvatarUpload`, `ChangePasswordForm`
    - `dashboard/index.ts` — re-exports `AnnouncementsPage` and `ChartLineMulti`
    - `dialogs/index.ts` — re-exports `Dialogue`
    - `proposals/index.ts` — re-exports `columns`, `ProposalsComp`, and `ProposalsDataTable`
    - All re-exports must use named exports; default exports should also be re-exported as named for consistency
    - _Requirements: 6.1, 6.2, 7.4, 7.5_
  - [x] 9.2 Update all import sites across `src/` to import from the barrel `index.ts` instead of direct file paths where the subdirectory is the natural import boundary
    - Example: `import { DataTableColumnHeader } from '@/components/parts/table'` instead of `'@/components/parts/table/data-column-header'`
    - Page files and layout files are the primary consumers to update
    - _Requirements: 6.2, 6.3_
  - [x] 9.3 Audit every component in `src/components/parts/` for single-responsibility — each file must export exactly one primary component
    - If a file exports multiple unrelated components, split them into separate files within the same subdirectory
    - Each component file must have a single default export (the component) and may have named exports only for its props interface and related types
    - _Requirements: 2.1, 2.5, 8.2_
  - [x] 9.4 Ensure every exported component has an explicitly typed props interface exported from its file
    - Props interfaces must be named `<ComponentName>Props` and exported as a named export alongside the component
    - Example: `export interface AnnouncementsPageProps { ... }` in `AnnouncementsPage.tsx`
    - This makes props discoverable via the barrel index without needing to open the implementation file
    - _Requirements: 8.2, 8.3_
  - [x] 9.5 Audit page files in `src/pages/` to ensure they contain no logic that belongs in a shared component
    - Each page file should only: import shared components, define route-specific data loaders/handlers, and compose the page layout
    - Any reusable UI fragment still embedded in a page file after Phase 5 must be extracted now
    - _Requirements: 1.2, 1.3, 2.1_
  - [x] 9.6 Add a top-level `src/components/parts/index.ts` that re-exports from all subdirectory barrels
    - This provides a single import point for consumers that need components from multiple subdirectories
    - _Requirements: 6.1, 6.2_
  - [x] 9.7 Run `tsc --noEmit` and confirm exit code 0
    - _Requirements: 7.2, 8.4_

- [x] 10. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster pass
- Each phase must have `tsc --noEmit` pass before starting the next phase
- `proposals/` subdirectory is intentionally left untouched throughout all phases
- Property tests in Phase 7 are static analysis tests — they do not require a running app
- Barrel `index.ts` files (Phase 8) are the primary mechanism for enforcing modularity — consumers should never need to know the internal file structure of a subdirectory
