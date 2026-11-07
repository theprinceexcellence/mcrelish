# Jollof ordering flow rebuild
- [x] Zero-friction product modal: Chicken pre-selected by default, protein cards with full plate prices, no mode switch or step labels.
- [x] Extra Rice capped at 1 per plate with a visible "Max 1 per plate" note; other extras unlimited.
- [x] Standalone Chicken (₦2,000) and Coleslaw (₦1,000) added to Daily Meals as orderable items.

# Checkout updates
- [x] Add a reference, itemized receipt, fulfilment details, and next steps.
- [x] Add a customer-controlled WhatsApp order handoff.
- [x] Harden existing persistent cart storage and verify refresh/return visits.
- [x] Verify delivery and pickup checkout, confirmation refresh, and page metadata.
- [x] Add optional customer sign-in, signup, password recovery, and editable customer profiles.
- [x] Verify authenticated profile saving and checkout prefilling.

Verification limits: Google/Lovable provider completion and emailed signup/recovery links require a real customer inbox/provider session; settings enabled, screens verified, email sign-in/profile/checkout/sign-out tested with a temporary account.
## Online payments & tickets
- [x] Orders saved in the database with server-side pricing
- [x] Flutterwave payment + verification + webhook
- [x] Branded downloadable ticket + send to WhatsApp
- [x] Admin page: prices, availability, delivery fees, order status
- [x] Smooth open/close animations for cart, food pop-up, mobile menu
- [ ] Flutterwave keys (waiting on owner)
- [x] Owner admin account

## Menu management
- [x] Compact section and item editor with image uploads, creation, visibility and ordering
- [x] Connect managed catalog to customer menu, homepage categories, cart and server pricing
- [x] Verify authenticated editing, new section/item creation, image upload and customer cart; preserve existing meal customization

Managed checkout pricing verified in tests; live payment completion still waits on the owner's Flutterwave keys.
