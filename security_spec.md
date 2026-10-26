# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Strict Tenant Ownership (`/users/{userId}` Master Gate)**:
   - Every teacher profile `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
   - Every sub-resource (`classes`, `students`, `lessons`, `evaluations`) under `/users/{userId}` requires an active parent document `/users/{userId}` owned by `request.auth.uid` (`get(/databases/$(database)/documents/users/$(userId)).data.uid == request.auth.uid`).
2. **Verified Auth & Anti-Email-Spoofing**:
   - All operations require either `request.auth.token.email_verified == true` (Google OAuth) OR a username-mapped password account (`sign_in_provider == 'password'` with `request.auth.token.email` matching `^[a-z0-9._\-]+@gv\.tinhocthuba\.local$`). Unverified external emails (e.g. `thichanhtha88@gmail.com` with `email_verified == false`) are unconditionally rejected.
3. **Referential Integrity**:
   - A `Student` cannot be created or moved unless `/users/{userId}/classes/{classId}` exists.
   - An `Evaluation` cannot be created unless its referenced `classId`, `studentId`, and `lessonId` all exist under `/users/{userId}`.
4. **Schema, Size, & Temporal Integrity**:
   - Every document ID matches `^[a-zA-Z0-9_\-]+$` (max 64/128 chars).
   - Every string field enforces strict `minLength`/`maxLength` boundaries from `firebase-blueprint.json`.
   - `createdAt` and `updatedAt` must equal server `request.time`; `uid`, `ownerId`, `id`, `username`, `authProvider`, and `createdAt` are immutable on update.
   - `historyEntries` array on `Evaluation` is bounded to `size() <= 10`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Profile Create)**: Authenticated user `uid_attacker` writes `/users/uid_victim` with `uid: "uid_victim"`. -> `PERMISSION_DENIED`.
2. **Payload 2 (Shadow Field Injection on Profile Update)**: Owner updates `/users/uid_1` adding unauthorized field `isAdmin: true`. -> `PERMISSION_DENIED`.
3. **Payload 3 (Email Spoofing Attack)**: Attacker registers `thichanhtha88@gmail.com` via password (`email_verified: false`) and attempts to create `/users/uid_spoof`. -> `PERMISSION_DENIED`.
4. **Payload 4 (Username Forgery on Password Account)**: User authenticated as `gv01@gv.tinhocthuba.local` attempts to create `/users/uid_1` with `username: "hieutruong"`. -> `PERMISSION_DENIED`.
5. **Payload 5 (Cross-Tenant Subcollection Read/List)**: User `uid_attacker` attempts `get` or `list` on `/users/uid_victim/students`. -> `PERMISSION_DENIED`.
6. **Payload 6 (Orphaned Class Write Without Parent User)**: User `uid_no_profile` attempts to create `/users/uid_no_profile/classes/3A` before creating `/users/uid_no_profile`. -> `PERMISSION_DENIED`.
7. **Payload 7 (Orphaned Student Referencing Non-Existent Class)**: Owner attempts to create `/users/uid_1/students/HS999` with `classId: "NON_EXISTENT"`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Orphaned Evaluation Referencing Non-Existent Lesson)**: Owner attempts to create `/users/uid_1/evaluations/eval_99` with `lessonId: "fake_lesson"`. -> `PERMISSION_DENIED`.
9. **Payload 9 (Immortal Field Mutation)**: Owner updates `/users/uid_1/classes/3A` changing `ownerId` or `createdAt`. -> `PERMISSION_DENIED`.
10. **Payload 10 (Resource/ID Poisoning)**: Owner attempts to create `/users/uid_1/classes/invalid$id!` or passes a 5,000-char string in `comment`. -> `PERMISSION_DENIED`.
11. **Payload 11 (Unbounded Array DoS on Evaluation)**: Owner creates `/users/uid_1/evaluations/eval_1` with 25 items in `historyEntries`. -> `PERMISSION_DENIED`.
12. **Payload 12 (Client Timestamp Forgery)**: Owner sends hardcoded past/future timestamp for `createdAt` or `updatedAt` instead of `serverTimestamp()`. -> `PERMISSION_DENIED`.
