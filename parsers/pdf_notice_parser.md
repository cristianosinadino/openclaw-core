# PDF Notice Parser Contract

## Goal
Turn messy auction/legal PDFs into trustworthy structured JSON.

## Extraction principles
- Preserve source excerpts for every high-value field
- Return null instead of guessing
- Record parser method used
- Record page number when possible
- Assign confidence per field

## Required output shape
```json
{
  "document_type": null,
  "address": null,
  "minimum_bid": null,
  "auction_date": null,
  "occupancy": null,
  "legal_notes": null,
  "source_excerpt_map": {},
  "field_confidence": {},
  "parser_method": null,
  "review_required": true
}
```
