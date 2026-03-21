# REC Protocol Code System

## Overview
The REC Protocol Code is automatically generated when a review type is assigned to a proposal during the risk assessment or reviewer assignment process.

## Format
```
CategoryCode-ReviewCode-Month-Year-SequenceNumber
```

### Category Codes
- `UG` - Undergraduate (also used for External)
- `GS` - Graduate School

### Review Type Codes
- `FR` - Full Review (Full Board)
- `ER` - Expedited Review
- `EX` - Exempt

### Examples
- **EXEMPT UNDERGRAD**: `UG-EX-01-26-0001`
- **EXEMPT GRAD SCHOOL**: `GS-EX-01-26-0001`
- **FULL BOARD UNDERGRAD**: `UG-FR-01-26-0001`
- **FULL BOARD GRAD SCHOOL**: `GS-FR-01-26-0001`
- **EXPEDITED UNDERGRAD**: `UG-ER-01-26-0001`
- **EXPEDITED GRAD SCHOOL**: `GS-ER-01-26-0001`

## Components

1. **Category Code**: Two-letter code (UG or GS)
2. **Review Type Code**: Two-letter code (FR, ER, or EX)
3. **Month**: Two-digit month (01-12)
4. **Year**: Two-digit year (26 for 2026)
5. **Sequence Number**: Four-digit auto-incrementing number (0001, 0002, etc.)

## How It Works

### Automatic Generation
The protocol code is automatically generated in two scenarios:

1. **During Risk Assessment** - When staff assigns a review type (Full Board, Expedited, or Exempt)
2. **During Reviewer Assignment** - When reviewers are assigned to the proposal

### Sequence Numbering
- The sequence number increments for each unique combination of CategoryCode-ReviewCode-Month-Year
- Resets to 0001 for each new month or different category/review type combination
- Queries the database to find the last used sequence number and increments by 1

## Database
The protocol code is stored in the `protocol_id` column of the `proposals` table in Supabase.

## Display Locations
The protocol code is displayed in:
- Proposals table (main column)
- Submission details page (as a badge)
- History logs (when assigned)
- Toast notifications (when generated)

## Implementation Files
- `src/utils/protocolCode.ts` - Core generation logic
- `src/pages/staff/Submissions/Review.tsx` - Integration with review workflow
- `src/components/parts/proposals/columns.tsx` - Table column display
