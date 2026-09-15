# REC Protocol Code Examples

## Pattern
```
CategoryCode-ReviewCode-Month-Year-SequenceNumber
```

## Code Mappings

### Category Codes
- `UG` = Undergraduate (also used for External proposals)
- `GS` = Graduate School

### Review Type Codes
- `FR` = Full Review (Full Board)
- `ER` = Expedited Review
- `EX` = Exempt

## Real-World Examples

### January 2026 Submissions

| Proposal | Category | Review Type | Protocol Code |
|----------|----------|-------------|---------------|
| Research Study A | Graduate | Full Board | `GS-FR-01-26-0001` |
| Research Study B | Graduate | Full Board | `GS-FR-01-26-0002` |
| Survey Project | Undergraduate | Expedited | `UG-ER-01-26-0001` |
| Interview Study | Graduate | Expedited | `GS-ER-01-26-0001` |
| Observation Study | Undergraduate | Exempt | `UG-EX-01-26-0001` |
| External Study | External | Exempt | `UG-EX-01-26-0002` |

### February 2026 Submissions (Sequence Resets)

| Proposal | Category | Review Type | Protocol Code |
|----------|----------|-------------|---------------|
| New Study | Graduate | Full Board | `GS-FR-02-26-0001` |
| Another Study | Graduate | Full Board | `GS-FR-02-26-0002` |
| Quick Survey | Undergraduate | Exempt | `UG-EX-02-26-0001` |

## All Possible Combinations

### Undergraduate (UG)
- `UG-EX-MM-YY-NNNN` - Exempt Undergraduate
- `UG-ER-MM-YY-NNNN` - Expedited Undergraduate
- `UG-FR-MM-YY-NNNN` - Full Board Undergraduate

### Graduate School (GS)
- `GS-EX-MM-YY-NNNN` - Exempt Graduate
- `GS-ER-MM-YY-NNNN` - Expedited Graduate
- `GS-FR-MM-YY-NNNN` - Full Board Graduate

## Key Features

1. **Compact Format**: Short codes make it easy to reference and communicate
2. **Unique Identification**: Each proposal gets a unique protocol code
3. **Chronological Tracking**: Month and year help track when proposals were reviewed
4. **Category Separation**: UG vs GS maintains separate sequences
5. **Review Type Clarity**: FR/ER/EX immediately shows the review level
6. **Sequential Ordering**: 4-digit sequence (0001-9999) allows for many submissions

## Workflow

1. Researcher submits a proposal → No protocol code yet
2. Staff performs risk assessment → Protocol code is generated
3. Staff assigns reviewers → Protocol code is confirmed/displayed
4. Protocol code appears in:
   - Proposals table
   - Submission details
   - History logs
   - Email notifications (if implemented)

## Database Storage

The protocol code is stored in the `protocol_id` column of the `proposals` table:

```sql
-- Example query to see protocol codes
SELECT proposal_id, protocol_id, proposal_title, category, review_type
FROM proposals
WHERE protocol_id IS NOT NULL
ORDER BY protocol_id DESC;

-- Count by category and review type for current month
SELECT 
  SUBSTRING(protocol_id, 1, 5) as code_prefix,
  COUNT(*) as count
FROM proposals
WHERE protocol_id LIKE '%-01-26-%'
GROUP BY code_prefix
ORDER BY code_prefix;
```
