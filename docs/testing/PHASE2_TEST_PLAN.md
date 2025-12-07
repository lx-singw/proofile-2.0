# Phase 2 Testing Plan: Resume Tools as Lead Magnets

## Test Coverage Summary

### Backend Tests (Python/Pytest)
- `test_resume_upload_anonymous.py` - Anonymous upload & analysis with paywalls
- `test_resume_build_anonymous.py` - Anonymous builder with paywalls
- `test_resume_authenticated.py` - Authenticated features (save, download, improvements)

### Frontend E2E Tests (Playwright)
- `phase2_resume_upload.spec.ts` - Upload flow (anonymous & authenticated)
- `phase2_resume_builder.spec.ts` - Builder flow (anonymous & authenticated)
- `phase2_paywall_conversion.spec.ts` - Paywall triggers & conversion

## Running Tests

### Backend
```bash
pytest backend/app/tests/test_resume_*.py -v
```

### E2E
```bash
npx playwright test tests/e2e/phase2_*.spec.ts
```

## Key Test Scenarios

1. **Anonymous Upload** → Analysis shown → Paywall on improvements
2. **Anonymous Build** → Live preview → Paywall on save/download
3. **Paywall Conversion** → Sign-up → Data preserved → Action completed
4. **Authenticated Access** → Full features unlocked

## Success Metrics
- All paywalls trigger correctly
- Data preserved through conversion
- Analysis quality meets standards
- Performance < 5s for uploads
