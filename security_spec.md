# Firestore Security Specification (LHSE E-Document System)

## 1. Data Invariants
1. Only authenticated, email-verified users or bootstrapped administrators (`nokohn@gmail.com` / `nokohn@mail.com`) may create, update, or read documents in `/documents/{docId}`.
2. Document IDs must strictly match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
3. String fields (`id`, `documentNumber`, `subject`, `direction`, `status`) must be validated for type and bounded in length.
4. Default-deny catch-all rule (`match /{document=**} { allow read, write: if false; }`) protects all undeclared paths.

## 2. The "Dirty Dozen" Payloads
1. Unauthenticated write to `/documents/doc-1` -> DENIED
2. Unverified email user attempting write -> DENIED
3. Oversized document ID (>128 chars) -> DENIED
4. Invalid characters in document ID (`doc/../../hack`) -> DENIED
5. Missing required field `subject` on create -> DENIED
6. Oversized `subject` (>1000 chars) -> DENIED
7. Invalid `direction` value (`INVALID_DIR`) -> DENIED
8. Non-integer `currentStepOrder` -> DENIED
9. Write to undeclared collection `/secret_logs/1` -> DENIED
10. Delete by non-admin user -> DENIED
11. Spoofed admin email with `email_verified == false` -> DENIED
12. Mutating immutable `id` field on update -> DENIED
