# DOONO Guide Role-Explanation Expansion

**Date:** 25 August 2026  
**Scope:** Existing nursery, primary, and secondary school roles only. No higher-education roles or institution mode were added.

## What changed

The guide now contains a detailed role profile for every current role in `ROLE_GUIDES`. Each profile explains the meaning of the role, its main purpose, the people and records it works with, what it can do, what it must not do, its normal working cycle, and the checks to complete before starting.

The covered roles are Software Owner, Organization Owner, Proprietor/Proprietress, Principal, Vice Principal Academic, Vice Principal Administration, Nursery Head, Primary Headmaster, Secondary Principal, Accountant, Bursar/Cashier, Librarian, Nurse, Hostel Master, Hostel Mistress, Transport Manager, Receptionist, Registrar, Guidance Counselor, Store Keeper, ICT Administrator, Security Officer, Teacher, Form Teacher, Parent/Guardian, and Student. The role source currently contains 26 named role entries, including school leadership and portal roles already present in the application.

The role profile is connected through `roleGuide()` so the modal Guide and the Support Centre use the same source. The Guide modal now displays five layers of role understanding: what the role means, its purpose and collaborators, permitted responsibilities, prohibited or unsafe actions, the normal working cycle, and first checks. The Support Centre searchable role article exposes the same information, allowing a new user to search terms such as “principal”, “teacher”, “bursar”, “form teacher”, “parent”, or “student”.

## Safety and accuracy principles

The content is intentionally aligned with the existing school-scoped architecture. It does not grant permissions, change role middleware, or make a button available. It explains that a role description is guidance while the backend permission and current-school context remain the authority. It also separates the platform-wide Software Owner from organization and school roles, keeps parent/student portals private, and explains that draft or unapproved academic results remain hidden.

## Validation

Guide coverage validation passed with 73 registered modules and 60 role guide entries. The DOONO architecture guard passed. Frontend lint passed with 0 errors and 89 existing warnings. The frontend production build passed. `git diff --check` passed.

The warning count is not increased by this expansion and remains a separate cleanup item, primarily involving hook dependency and unused-code warnings in older pages.
