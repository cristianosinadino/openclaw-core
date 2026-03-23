# First 30 Minutes

## 1. Bring up support services
```bash
docker compose up -d
```

## 2. Install OpenClaw on host
```bash
./scripts/install_openclaw_host.sh
```

## 3. Complete onboarding
Configure your preferred provider.

## 4. Create your first project test
- Save one real HTML listing to `data/raw/`
- Save one real PDF notice to `data/raw/`
- Draft the target schema in `parsers/`
- Run one manual extraction and validation pass

## 5. Do not scale yet
Only continue after one source is consistently parseable.
