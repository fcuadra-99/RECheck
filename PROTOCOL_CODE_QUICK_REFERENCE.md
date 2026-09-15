# Protocol Code Quick Reference

## Format
```
CC-RR-MM-YY-NNNN
```

## Codes

### Category Codes (CC)
| Category | Code |
|----------|------|
| Undergraduate | `UG` |
| Graduate | `GS` |
| External | `UG` |

### Review Type Codes (RR)
| Review Type | Code |
|-------------|------|
| Exempt | `EX` |
| Expedited | `ER` |
| Full Board | `FR` |

### Date Components
- **MM**: Month (01-12)
- **YY**: Year (last 2 digits)
- **NNNN**: Sequence (0001-9999)

## Examples

```
UG-EX-01-26-0001  → Exempt Undergraduate, January 2026, #1
GS-EX-01-26-0001  → Exempt Graduate, January 2026, #1
UG-FR-01-26-0001  → Full Board Undergraduate, January 2026, #1
GS-FR-01-26-0001  → Full Board Graduate, January 2026, #1
UG-ER-01-26-0001  → Expedited Undergraduate, January 2026, #1
GS-ER-01-26-0001  → Expedited Graduate, January 2026, #1
```

## Sequence Logic

Each combination of `CC-RR-MM-YY` has its own sequence counter:
- `UG-EX-01-26-0001`, `UG-EX-01-26-0002`, `UG-EX-01-26-0003`...
- `GS-FR-01-26-0001`, `GS-FR-01-26-0002`, `GS-FR-01-26-0003`...

Sequences reset each month:
- January: `UG-EX-01-26-0001`
- February: `UG-EX-02-26-0001` (back to 0001)
