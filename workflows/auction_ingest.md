# Auction Ingest Workflow

INPUT -> SCRAPE -> PARSE -> VALIDATE -> STORE -> ACTION

## Steps
1. Fetch listing page HTML
2. Save raw HTML to `data/raw/`
3. Download linked PDF notices to `data/raw/`
4. Parse target fields into JSON
5. Validate parsed fields against source text
6. Save final envelope to `data/processed/`
7. Flag low-confidence listings for review

## Target fields
- source_site
- listing_id
- address
- city
- state
- auction_date
- minimum_bid
- occupancy
- legal_notes
- source_urls
- confidence_tier
