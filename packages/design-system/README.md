# @tensaw/design-system

Design tokens, primitive components, form components, and the full RCM field catalog.

Implements **Phase 3** of the v3 plan.

## Scope

- Design tokens (color, spacing, typography, radius, shadow, z-index, motion)
- Theme provider with density (comfortable/compact) and mode (light/dark)
- Primitives: Button, Tabs, Modal, Drawer, Card, Tooltip, etc.
- Form primitives wrapping React Hook Form
- 30+ RCM-specific fields:
  - Identifiers: NPI, EIN, SSN, DEA, NDC, Taxonomy, MRN, Member ID, etc.
  - Coding: CPT (with modifiers), HCPCS, ICD-10, POS, CARC, RARC, CAS group
  - Money (USD): allowed, adjustment, write-off, balance, copay, deductible
  - Dates: DOS, DOB, posted, check date with domain rules
  - Contact: Phone, Fax, Email, AddressBlock with US states + ZIP
  - Banking: Routing #, Bank account, Check #
  - Cards: Stripe Elements wrappers (CardNumber, CardExpiry, CardCvc)
- `<PrivacyField>` HIPAA wrapper (mask + reveal-on-permission + audit)

## Status

Phase 3 — pending Phase 1 runtime completion.
