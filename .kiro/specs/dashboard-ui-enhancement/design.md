# Design Document: Dashboard UI Enhancement

## Overview

This design document outlines the technical approach for enhancing the visual design and consistency of the dashboard interface. The dashboard serves as the primary landing page for both researcher and staff roles (admin, chairperson, admin assistant), displaying announcements, statistics, recent activity, and proposal trends.

The current implementation has several visual inconsistencies:
- Recent actions table entries lack uniform formatting
- Stats cards have inconsistent styling and visual hierarchy
- Announcements section needs improved card design
- Color palette and typography are applied inconsistently
- Responsive behavior needs refinement
- Chart components don't match the overall design language
- Loading and empty states are missing or inconsistent
- Interactive elements lack consistent hover/focus states

This enhancement will create a cohesive, polished dashboard experience by establishing a unified design system and applying it consistently across all dashboard components.

### Goals

1. Establish a consistent visual design language across all dashboard elements
2. Improve readability and visual hierarchy
3. Enhance user experience with proper loading and empty states
4. Ensure responsive behavior across all screen sizes
5. Maintain accessibility standards (WCAG AA)
6. Create reusable styling patterns for future dashboard enhancements

### Non-Goals

1. Changing the functional behavior of dashboard components
2. Modifying the data fetching or business logic
3. Restructuring the component hierarchy
4. Adding new dashboard features or metrics

## Architecture

### Component Structure

The dashboard is implemented in `AnnouncementsPage.tsx` as a single component that conditionally renders different sections based on user role. The architecture follows this structure:

```
AnnouncementsPage (Main Container)
├── Header Section
│   ├── Dashboard Title & Icon
│   └── Create Announcement Button (staff only)
├── Dashboard Section (staff only)
│   ├── Stats Cards Grid
│   │   ├── Total Proposals Card
│   │   ├── Pending Card
│   │   └── Completed Card
│   ├── Chart Component (ChartLineMultiple)
│   └── Recent Actions Panel
│       ├── Actions List (paginated)
│       └── Pagination Controls
├── Create Announcement Dialog
└── Announcements Feed
    └── Announcement Cards (list)
```

### Design System Foundation

The application uses a CSS custom properties-based design system defined in `App.css` with support for light and dark modes. The design system includes:

- **Color Tokens**: Primary, secondary, muted, accent, destructive, border, input, ring
- **Chart Colors**: chart-1 through chart-5 for data visualization
- **Spacing**: Consistent padding and margin units
- **Border Radius**: Defined radius values (sm, md, lg, xl)
- **Typography**: Defined through Tailwind utility classes

### Styling Approach

The enhancement will use:
1. **Tailwind CSS utility classes** for consistent spacing, typography, and layout
2. **CSS custom properties** for colors to maintain theme compatibility
3. **Component-level styling** using className composition
4. **Shadcn/ui components** as the base UI library (Card, Button, Skeleton, etc.)

### Role-Based Rendering

The dashboard adapts its content based on user role:
- **Researchers**: See only announcements feed
- **Staff (admin/chairperson/admin assistant)**: See full dashboard with stats, chart, recent actions, and announcements

## Components and Interfaces

### 1. Stats Cards Component

**Current Implementation**: Inline div elements with inconsistent styling

**Enhanced Design**:
- Use consistent card wrapper with rounded corners, border, shadow
- Establish clear visual hierarchy: icon → label → value → description
- Apply role-specific colors: blue (total), amber (pending), emerald (completed)
- Add subtle hover effects with smooth transitions
- Ensure consistent icon sizing (w-4 h-4) and positioning

**Styling Pattern**:
```tsx
<div className="flex flex-col justify-between rounded-2xl bg-white p-5 border shadow-sm hover:shadow-md transition-all duration-200">
  <div>
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
      <Icon className="w-4 h-4 text-{color}-500 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-1 text-3xl font-bold text-{color}-600 break-words">
      {value}
    </div>
  </div>
  <p className="text-xs text-gray-400 mt-2 sm:mt-3">{description}</p>
</div>
```

### 2. Recent Actions Table

**Current Implementation**: Border-wrapped divs with basic styling

**Enhanced Design**:
- Normalize action type text formatting (title case)
- Truncate comments at 160 characters with ellipsis
- Consistent timestamp formatting using `formatDate` helper
- Align actor information and timestamps consistently
- Add subtle hover effect on action entries

**Styling Pattern**:
```tsx
<div className="rounded-md border px-3 py-2 hover:bg-gray-50 transition-colors">
  <div className="text-sm font-medium text-gray-800 capitalize">
    {normalizeActionType(action)}
  </div>
  <div className="text-xs text-gray-500 mt-1">
    {truncateText(comment, 160)}
  </div>
  <div className="mt-2 flex items-center text-xs text-gray-400 justify-between">
    <div>{actor}</div>
    <div>{formatDate(date)}</div>
  </div>
</div>
```

### 3. Announcements Section

**Current Implementation**: Basic card layout with inconsistent spacing

**Enhanced Design**:
- Consistent card styling with rounded corners and borders
- Clear visual hierarchy: icon → title/badge → metadata → description
- Distinct badge colors: green (all), blue (students), yellow (committee)
- Truncate descriptions at 300 characters with "Read more" indicator
- Hover effect with border color change and background tint
- Proper text wrapping and line height

**Styling Pattern**:
```tsx
<article className="p-4 rounded-xl border hover:border-primary/50 transition-all cursor-pointer hover:bg-gray-50">
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 rounded-full bg-primary/10 p-2 text-primary">
      <Megaphone className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-2">
        <div className="font-semibold text-gray-900 truncate">{title}</div>
        <span className="text-xs px-2 py-1 rounded-full shrink-0 {badgeColor}">
          {audienceLabel}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {author} • {date}
      </div>
      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line break-words">
        {truncatedDescription}
        {isLong && <span className="text-primary font-medium ml-1">Read more</span>}
      </p>
    </div>
  </div>
</article>
```

### 4. Chart Component Enhancement

**Current Implementation**: ChartLineMultiple with placeholder footer text

**Enhanced Design**:
- Match card styling with stats cards (rounded-2xl, consistent padding)
- Use chart colors from design system (chart-1 through chart-4)
- Update footer to reflect actual data instead of placeholder
- Ensure proper spacing between chart and card boundaries
- Consistent typography for title and description

**Required Changes**:
- Update footer text to be dynamic based on actual data trends
- Ensure chart colors align with design system
- Match card border and shadow styling

### 5. Loading States

**Implementation**: Skeleton loaders matching final content layout

**Design**:
- Stats cards: Skeleton rectangles matching card dimensions
- Recent actions: Skeleton list items with text placeholders
- Announcements: Skeleton cards with title and description placeholders
- Use consistent animation timing (animate-pulse)

**Styling Pattern**:
```tsx
<Skeleton className="h-32 w-full rounded-2xl" />
<Skeleton className="h-4 w-3/4 rounded" />
<Skeleton className="h-3 w-1/2 rounded mt-2" />
```

### 6. Empty States

**Implementation**: Centered messages with consistent styling

**Design**:
- Use muted text color (text-gray-400)
- Center align with appropriate padding
- Consistent typography (text-sm)
- Optional icon for visual interest

**Styling Pattern**:
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="w-12 h-12 text-gray-300 mb-3" />
  <p className="text-sm text-gray-400">{emptyMessage}</p>
</div>
```

### 7. Interactive Elements

**Buttons**: Already using shadcn/ui Button component with consistent variants

**Pagination Controls**:
- Consistent disabled state styling (opacity-50)
- Hover effects on enabled buttons
- Clear visual feedback

**Focus Indicators**:
- Use ring utility classes for keyboard navigation
- Consistent focus-visible states

### Interface Definitions

```typescript
// Existing interfaces (no changes needed)
export interface DashboardStats {
  total: number;
  pending: number;
  completed: number;
}

export type StatsLoader = () => Promise<DashboardStats>;

export interface AnnouncementsPageProps {
  user: any;
  profile: Profile;
  statsLoader: StatsLoader;
}

interface ProposalChartData {
  month: string;
  External: number;
  Graduate: number;
  Undergraduate: number;
}

// New utility types for styling
type BadgeVariant = 'all' | 'students' | 'committee';
type StatType = 'total' | 'pending' | 'completed';
```

## Data Models

No changes to data models are required. This enhancement focuses solely on visual presentation of existing data structures.

### Existing Data Structures

**Announcements**:
```typescript
{
  id: string;
  title: string;
  description: string;
  audience: 'all' | 'students' | 'committee';
  created_by_email: string;
  created_at: string;
  attachments?: any[];
}
```

**History (Recent Actions)**:
```typescript
{
  history_id: string;
  action?: string;
  history_type?: string;
  comment?: string;
  actor?: string;
  history_date?: string;
}
```

**Proposals** (for chart data):
```typescript
{
  updated_on: string;
  category: 'undergraduate' | 'graduate' | 'external';
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated to avoid redundancy:

**Consolidation Decisions**:

1. **Styling Consistency Properties**: Properties 1.1, 1.2, 1.5, 2.1, 2.5, 2.7, 3.1, 3.6, 3.7 all test for consistent CSS class application across similar elements. These can be consolidated into broader "styling consistency" properties per component.

2. **Typography Consistency**: Properties 4.2, 6.3 both test typography consistency and can be combined into a single dashboard-wide property.

3. **Spacing Consistency**: Properties 4.3, 6.4 both test spacing consistency and can be combined.

4. **Empty State Consistency**: Properties 7.2, 7.3, 7.5 all test empty state styling and can be consolidated.

5. **Interactive Element Consistency**: Properties 8.1, 8.4, 8.5 all test interactive element styling and can be consolidated.

6. **Color System Usage**: Properties 4.1, 6.2 both verify color palette usage and can be combined.

7. **Border Consistency**: Properties 4.5, 6.1 both test border styling and can be combined.

After consolidation, we have the following unique, non-redundant properties:

### Property 1: Recent Actions Styling Consistency

*For any* set of action entries rendered in the Recent Actions table, all entries should use identical CSS classes for typography, spacing, layout structure, font weight, and color.

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 2: Comment Truncation

*For any* action entry with a comment, if the comment length exceeds 160 characters, the rendered output should contain exactly the first 160 characters followed by an ellipsis.

**Validates: Requirements 1.3**

### Property 3: Timestamp Format Consistency

*For any* set of action entries with timestamps, all rendered timestamps should follow the same format pattern (as defined by the formatDate helper function).

**Validates: Requirements 1.4**

### Property 4: Action Type Normalization

*For any* action type string (e.g., "Submit Phase", "deny", "assess"), the rendered output should normalize the text to a consistent case format (title case or sentence case).

**Validates: Requirements 1.6**

### Property 5: Stats Cards Styling Consistency

*For any* stat card type (total, pending, completed), all rendered cards should use identical border-radius, padding, shadow, icon sizing, spacing, and font sizing/weight classes.

**Validates: Requirements 2.1, 2.5, 2.6, 2.7**

### Property 6: Stats Cards Visual Hierarchy

*For any* stat card, the rendered DOM structure should contain elements in this exact order: icon, label, value, description.

**Validates: Requirements 2.2**

### Property 7: Stats Cards Color Differentiation

*For any* pair of different stat card types (total vs pending, pending vs completed, total vs completed), the rendered cards should use different color classes for their icons and values.

**Validates: Requirements 2.3**

### Property 8: Stats Cards Hover Effects

*For any* stat card, the rendered element should include hover effect classes that modify only visual properties (shadow, background) without changing layout properties (width, height, position).

**Validates: Requirements 2.4**

### Property 9: Announcements Card Styling Consistency

*For any* set of announcement cards, all cards should use identical border, padding, spacing, and icon sizing classes.

**Validates: Requirements 3.1, 3.6**

### Property 10: Announcements Visual Hierarchy

*For any* announcement card, the rendered DOM structure should contain elements in this hierarchical order: icon, title/badge, metadata (author/timestamp), description.

**Validates: Requirements 3.2**

### Property 11: Announcement Badge Color Differentiation

*For any* pair of announcements with different audience values (all, students, committee), the rendered badge elements should use different color classes.

**Validates: Requirements 3.3**

### Property 12: Announcement Description Truncation

*For any* announcement with a description, if the description length exceeds 300 characters, the rendered output should contain exactly the first 300 characters followed by "..." and a "Read more" indicator.

**Validates: Requirements 3.4**

### Property 13: Announcements Hover Effects

*For any* announcement card, the rendered element should include hover effect classes for border and background.

**Validates: Requirements 3.5**

### Property 14: Announcements Text Wrapping

*For any* announcement card text content, the rendered elements should include appropriate line-height and word-wrap classes to prevent overflow.

**Validates: Requirements 3.7**

### Property 15: Dashboard Color System Consistency

*For any* dashboard component (stats cards, announcements, chart, actions), all color values should reference CSS custom properties from the defined color palette (--primary, --chart-1, etc.) rather than hardcoded color values.

**Validates: Requirements 4.1, 6.2**

### Property 16: Dashboard Typography Consistency

*For any* text element across all dashboard components, elements of the same semantic type (headings, body text, labels) should use identical font-family, font-size, and font-weight classes.

**Validates: Requirements 4.2, 6.3**

### Property 17: Dashboard Spacing Consistency

*For any* dashboard component, all spacing values (padding, margin, gap) should use values from a consistent spacing scale (Tailwind's spacing system).

**Validates: Requirements 4.3, 6.4**

### Property 18: Text Contrast Accessibility

*For any* text element on the dashboard, the contrast ratio between the text color and its background color should meet or exceed WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 4.4**

### Property 19: Border Styling Consistency

*For any* bordered element across all dashboard components (cards, buttons, containers, chart), all should use consistent border-width values and border-radius values from the defined radius scale.

**Validates: Requirements 4.5, 6.1**

### Property 20: Stats Cards Responsive Stacking

*For any* viewport width below 768px, the stats cards grid should render with a single column layout (vertical stacking) with consistent gap spacing.

**Validates: Requirements 5.1**

### Property 21: Dashboard Grid Responsive Adjustment

*For any* viewport width below 1024px, the main dashboard grid should adjust from 2 columns to a single column or adjusted column count while maintaining readability.

**Validates: Requirements 5.2**

### Property 22: Mobile Font Size Readability

*For any* text element in the Recent Actions table at mobile viewport widths (<768px), the font size should meet minimum readability standards (at least 14px for body text).

**Validates: Requirements 5.3**

### Property 23: Announcements No Horizontal Scroll

*For any* viewport width, the announcements section should not trigger horizontal scrolling (all content should fit within viewport width with appropriate wrapping).

**Validates: Requirements 5.4**

### Property 24: Touch Target Minimum Size

*For any* interactive element (buttons, links, pagination controls) on mobile viewports, the rendered element should have minimum dimensions of 44x44 pixels.

**Validates: Requirements 5.5**

### Property 25: Chart Footer Dynamic Content

*For any* chart component with data, the footer text should reflect actual data characteristics (e.g., trend direction, time period) rather than displaying static placeholder text.

**Validates: Requirements 6.5**

### Property 26: Skeleton Loader Layout Matching

*For any* loading state, the skeleton loader dimensions and layout should match the dimensions and layout of the actual content it represents.

**Validates: Requirements 7.1**

### Property 27: Empty State Consistency

*For any* component in an empty state (Recent Actions, Announcements), the empty state message should use consistent typography classes (text-sm, text-gray-400) and layout (centered with appropriate padding).

**Validates: Requirements 7.2, 7.3, 7.5**

### Property 28: Loading Animation Consistency

*For any* loading animation across the dashboard, all animations should use the same duration and easing function (animate-pulse).

**Validates: Requirements 7.4**

### Property 29: Interactive Element Hover and Focus Consistency

*For any* interactive element across the dashboard, all should have hover classes with transition properties and focus-visible classes for keyboard navigation.

**Validates: Requirements 8.1, 8.4**

### Property 30: Button Variant Consistency

*For any* button across the dashboard, the button should use one of the defined button variants (default, outline, ghost) from the design system.

**Validates: Requirements 8.2**

### Property 31: Disabled State Styling Consistency

*For any* pagination control in a disabled state, the element should have consistent opacity (opacity-50) and cursor (cursor-not-allowed) styling.

**Validates: Requirements 8.3**

### Property 32: Cursor Style Consistency

*For any* element on the dashboard, interactive elements should have cursor-pointer class and non-interactive elements should have default cursor.

**Validates: Requirements 8.5**


## Error Handling

Since this feature focuses on visual enhancements rather than functional changes, error handling primarily concerns graceful degradation and fallback behaviors:

### 1. Missing or Invalid Data

**Scenario**: Component receives undefined, null, or malformed data

**Handling**:
- Use optional chaining and nullish coalescing for safe property access
- Provide default values for missing data (e.g., empty strings, zero values)
- Display empty states when data arrays are empty or undefined

**Example**:
```typescript
const actionType = act.action ?? act.history_type ?? 'action';
const comment = act.comment ?? '';
const formattedDate = formatDate(act.history_date) ?? 'Unknown date';
```

### 2. Text Truncation Edge Cases

**Scenario**: Text content is exactly at truncation threshold or contains special characters

**Handling**:
- Use precise string slicing with length checks
- Handle Unicode characters correctly (avoid splitting multi-byte characters)
- Ensure ellipsis is only added when truncation actually occurs

**Example**:
```typescript
const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
};
```

### 3. Responsive Layout Failures

**Scenario**: CSS classes fail to apply or viewport detection is incorrect

**Handling**:
- Use mobile-first responsive design with progressive enhancement
- Provide fallback layouts that work without media queries
- Test across multiple viewport sizes during development

### 4. Color Contrast Failures

**Scenario**: Custom theme or user preferences result in insufficient contrast

**Handling**:
- Use semantic color tokens that maintain contrast ratios
- Test both light and dark modes
- Provide fallback colors if custom properties are undefined

### 5. Animation Performance

**Scenario**: Animations cause performance issues on low-end devices

**Handling**:
- Use CSS transforms and opacity for animations (GPU-accelerated)
- Respect prefers-reduced-motion media query
- Keep animations simple and short-duration

**Example**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6. Loading State Timing

**Scenario**: Data loads too quickly or too slowly for loading states to be useful

**Handling**:
- Always show loading states, even if brief
- Use skeleton loaders that match final content layout
- Avoid flash of loading content (FOLC) with minimum display time if needed

### 7. Empty State Edge Cases

**Scenario**: Component transitions between empty and populated states

**Handling**:
- Ensure smooth transitions between states
- Maintain consistent layout height to prevent content jumping
- Provide clear messaging about why content is empty

## Testing Strategy

This feature requires a dual testing approach combining unit tests for specific styling scenarios and property-based tests for comprehensive coverage of styling consistency.

### Testing Framework

**Unit Testing**: Vitest + React Testing Library
**Property-Based Testing**: fast-check (JavaScript/TypeScript PBT library)
**Configuration**: Minimum 100 iterations per property test

### Unit Testing Approach

Unit tests will focus on:
1. **Specific examples**: Verify correct rendering of known data scenarios
2. **Edge cases**: Test truncation boundaries, empty states, loading states
3. **Responsive behavior**: Test layout changes at specific breakpoints
4. **Accessibility**: Verify ARIA attributes and semantic HTML

**Example Unit Tests**:

```typescript
describe('AnnouncementsPage - Stats Cards', () => {
  it('should render total proposals card with correct styling', () => {
    const { getByText } = render(<AnnouncementsPage {...props} />);
    const card = getByText('Total Proposals').closest('div');
    expect(card).toHaveClass('rounded-2xl', 'bg-white', 'p-5', 'border', 'shadow-sm');
  });

  it('should truncate comments at exactly 160 characters', () => {
    const longComment = 'a'.repeat(200);
    const action = { comment: longComment, action: 'test' };
    const { getByText } = render(<ActionEntry action={action} />);
    expect(getByText(/a{160}…/)).toBeInTheDocument();
  });

  it('should display empty state when no announcements exist', () => {
    const { getByText } = render(<AnnouncementsPage {...propsWithEmptyData} />);
    expect(getByText('No announcements.')).toBeInTheDocument();
  });
});
```

### Property-Based Testing Approach

Property tests will verify universal styling properties across all possible inputs. Each property test will:
- Generate random valid data (announcements, actions, stats)
- Render components with generated data
- Verify styling properties hold for all generated inputs
- Run minimum 100 iterations per test

**Property Test Configuration**:

```typescript
import fc from 'fast-check';
import { render } from '@testing-library/react';

// Generators for test data
const actionEntryArbitrary = fc.record({
  history_id: fc.uuid(),
  action: fc.oneof(fc.constant('Submit Phase'), fc.constant('deny'), fc.constant('assess')),
  comment: fc.string({ minLength: 0, maxLength: 500 }),
  actor: fc.emailAddress(),
  history_date: fc.date().map(d => d.toISOString()),
});

const announcementArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 1000 }),
  audience: fc.oneof(fc.constant('all'), fc.constant('students'), fc.constant('committee')),
  created_by_email: fc.emailAddress(),
  created_at: fc.date().map(d => d.toISOString()),
});
```

**Example Property Tests**:

```typescript
/**
 * Feature: dashboard-ui-enhancement, Property 2: Comment Truncation
 * For any action entry with a comment, if the comment length exceeds 160 characters,
 * the rendered output should contain exactly the first 160 characters followed by an ellipsis.
 */
describe('Property 2: Comment Truncation', () => {
  it('should truncate all comments exceeding 160 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 161, maxLength: 1000 }),
        (comment) => {
          const action = { comment, action: 'test', history_id: '1' };
          const { container } = render(<ActionEntry action={action} />);
          const renderedText = container.textContent || '';
          
          // Should contain first 160 chars + ellipsis
          expect(renderedText).toContain(comment.slice(0, 160));
          expect(renderedText).toContain('…');
          // Should not contain characters beyond 160
          expect(renderedText).not.toContain(comment.slice(161));
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: dashboard-ui-enhancement, Property 5: Stats Cards Styling Consistency
 * For any stat card type, all rendered cards should use identical border-radius,
 * padding, shadow, icon sizing, spacing, and font sizing/weight classes.
 */
describe('Property 5: Stats Cards Styling Consistency', () => {
  it('should apply consistent styling classes to all stat card types', () => {
    fc.assert(
      fc.property(
        fc.record({
          total: fc.nat(1000),
          pending: fc.nat(1000),
          completed: fc.nat(1000),
        }),
        (stats) => {
          const { container } = render(<StatsCards stats={stats} />);
          const cards = container.querySelectorAll('[data-testid="stat-card"]');
          
          const expectedClasses = ['rounded-2xl', 'bg-white', 'p-5', 'border', 'shadow-sm'];
          
          cards.forEach(card => {
            expectedClasses.forEach(className => {
              expect(card).toHaveClass(className);
            });
          });
          
          // Verify all cards have same classes
          const firstCardClasses = Array.from(cards[0].classList).sort();
          cards.forEach(card => {
            const cardClasses = Array.from(card.classList).sort();
            expect(cardClasses).toEqual(firstCardClasses);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: dashboard-ui-enhancement, Property 11: Announcement Badge Color Differentiation
 * For any pair of announcements with different audience values,
 * the rendered badge elements should use different color classes.
 */
describe('Property 11: Announcement Badge Color Differentiation', () => {
  it('should use different colors for different audience badges', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('all', 'students', 'committee'),
          fc.constantFrom('all', 'students', 'committee')
        ).filter(([a, b]) => a !== b),
        ([audience1, audience2]) => {
          const announcement1 = { ...baseAnnouncement, audience: audience1 };
          const announcement2 = { ...baseAnnouncement, audience: audience2 };
          
          const { container: container1 } = render(<AnnouncementCard announcement={announcement1} />);
          const { container: container2 } = render(<AnnouncementCard announcement={announcement2} />);
          
          const badge1 = container1.querySelector('[data-testid="audience-badge"]');
          const badge2 = container2.querySelector('[data-testid="audience-badge"]');
          
          const badge1Classes = Array.from(badge1?.classList || []);
          const badge2Classes = Array.from(badge2?.classList || []);
          
          // Should have different color classes
          const colorClasses1 = badge1Classes.filter(c => c.includes('bg-') || c.includes('text-'));
          const colorClasses2 = badge2Classes.filter(c => c.includes('bg-') || c.includes('text-'));
          
          expect(colorClasses1).not.toEqual(colorClasses2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: dashboard-ui-enhancement, Property 18: Text Contrast Accessibility
 * For any text element on the dashboard, the contrast ratio between text color
 * and background color should meet or exceed WCAG AA standards.
 */
describe('Property 18: Text Contrast Accessibility', () => {
  it('should maintain WCAG AA contrast ratios for all text elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          announcements: fc.array(announcementArbitrary, { minLength: 1, maxLength: 10 }),
          stats: fc.record({
            total: fc.nat(1000),
            pending: fc.nat(1000),
            completed: fc.nat(1000),
          }),
        }),
        (data) => {
          const { container } = render(<AnnouncementsPage {...props} data={data} />);
          
          // Get all text elements
          const textElements = container.querySelectorAll('p, span, div, h1, h2, h3');
          
          textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const textColor = styles.color;
            const bgColor = styles.backgroundColor;
            
            const contrastRatio = calculateContrastRatio(textColor, bgColor);
            const fontSize = parseFloat(styles.fontSize);
            const fontWeight = parseInt(styles.fontWeight);
            
            // Large text: 18pt+ or 14pt+ bold
            const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
            const minRatio = isLargeText ? 3 : 4.5;
            
            expect(contrastRatio).toBeGreaterThanOrEqual(minRatio);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: dashboard-ui-enhancement, Property 24: Touch Target Minimum Size
 * For any interactive element on mobile viewports, the rendered element
 * should have minimum dimensions of 44x44 pixels.
 */
describe('Property 24: Touch Target Minimum Size', () => {
  it('should ensure all interactive elements meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.record({
          announcements: fc.array(announcementArbitrary, { minLength: 1, maxLength: 5 }),
        }),
        (data) => {
          // Set mobile viewport
          global.innerWidth = 375;
          global.innerHeight = 667;
          
          const { container } = render(<AnnouncementsPage {...props} data={data} />);
          
          // Get all interactive elements
          const interactiveElements = container.querySelectorAll('button, a, [role="button"]');
          
          interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            expect(rect.width).toBeGreaterThanOrEqual(44);
            expect(rect.height).toBeGreaterThanOrEqual(44);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── dashboard/
│   │   ├── AnnouncementsPage.test.tsx
│   │   ├── StatsCards.test.tsx
│   │   ├── RecentActions.test.tsx
│   │   └── ChartComponent.test.tsx
│   └── utils/
│       └── textTruncation.test.ts
└── properties/
    ├── dashboard-styling-consistency.test.ts
    ├── dashboard-truncation.test.ts
    ├── dashboard-responsive.test.ts
    ├── dashboard-accessibility.test.ts
    └── dashboard-interactive-elements.test.ts
```

### Coverage Goals

- **Unit Test Coverage**: 80%+ line coverage for modified components
- **Property Test Coverage**: All 32 correctness properties implemented
- **Visual Regression**: Manual review of screenshots at key breakpoints
- **Accessibility**: Automated axe-core tests + manual keyboard navigation testing

### Testing Utilities

**Helper Functions**:

```typescript
// Calculate WCAG contrast ratio
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Extract CSS classes from element
function extractClasses(element: Element, pattern: RegExp): string[] {
  return Array.from(element.classList).filter(c => pattern.test(c));
}

// Verify consistent spacing scale
function isConsistentSpacing(value: string): boolean {
  const spacingScale = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24'];
  return spacingScale.some(s => value.includes(s));
}
```

### Continuous Integration

All tests should run on:
- Pull request creation
- Commit to main branch
- Nightly builds for comprehensive property test runs

Property tests with 100+ iterations may be slower, so consider:
- Running subset (10 iterations) on PR, full suite on merge
- Parallel test execution
- Caching test results for unchanged code

