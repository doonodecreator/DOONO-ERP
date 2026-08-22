# DOONO ERP Mobile UI Audit and Repair

## Verified root cause

The screenshot’s oversized blue checkbox controls were caused by the global legacy selector `input:not([class]) { width: 100%; min-height: 42px; }`, which also matched native checkbox inputs without a class. The same screen was additionally affected by a sticky form-action default, a fixed footer, and independent bottom guide/scroll controls competing for the same mobile space.

## Shared repairs

The legacy control selector now excludes checkbox and radio inputs. All native checkbox/radio controls receive a bounded 20px mobile-safe size, compact padding, and a consistent accent color. `FormActions` is now non-sticky by default; pages must opt into sticky actions deliberately. Explicit sticky actions use the footer height and safe-area inset in their bottom offset without negative margins. Disabled legacy and shared buttons retain readable contrast while visibly communicating their disabled/loading state.

Legacy fixed modals now receive viewport-safe scrolling and constrained inner height on phones. Raw non-shared tables receive a horizontal-scroll fallback at the mobile breakpoint. Shared PageHeader actions stack without forcing horizontal overflow, and headings without explicit responsive utility sizes are reduced on small screens. The screenshoted Platform Email Center now has semantic toggle rows, readable labels, a full-width mobile Save button, and explicit disabled-state contrast.

## Role dashboard coverage

| Role dashboard family | Static scan result | Shared repair coverage |
|---|---:|---|
| Platform Owner | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell and responsive heading/action safeguards |
| Organization Owner | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell and responsive heading/action safeguards |
| Proprietor | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Principal | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Vice Principal Academic | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Vice Principal Admin | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Nursery Head | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Primary Headmaster | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Secondary Principal | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Teacher | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared shell, form actions, controls, and PageHeader |
| Form Teacher | One inline style marker in existing dashboard content; no page-level fixed/sticky controls | Shared shell and responsive safeguards; inline legacy styling remains a later visual-refactor target |
| Bursar/Accountant | No dashboard checkbox controls; accountant contains a modal trigger | Shared control and modal safeguards |
| Cashier | No dashboard checkbox controls; no page-level fixed/sticky controls | Shared control and table safeguards |
| Librarian | Modal controls present; dialogs now receive mobile constrained scrolling | Shared control and modal safeguards |
| Nurse | Modal controls present; dialogs now receive mobile constrained scrolling | Shared control and modal safeguards |
| Hostel Master/Mistress | Modal controls present; dialogs now receive mobile constrained scrolling | Shared control and modal safeguards |
| Transport Manager | Modal controls present; dialogs now receive mobile constrained scrolling | Shared control, raw-table, and modal safeguards |
| Receptionist | Modal controls present; dialogs now receive mobile constrained scrolling | Shared control, raw-table, and modal safeguards |
| Student and Parent portals | Covered by the same authenticated shell and responsive control baseline | Shared shell, table, heading, and footer-clearance safeguards |

## Validation

The frontend production build passed after the repairs. `git diff --check` passed. The static scan confirms the FormActions default is now `sticky = false` and the checkbox selectors explicitly exclude checkboxes from text-input sizing. The Vite build still reports the existing large JavaScript chunk warning; this does not prevent deployment but should be addressed later with route-level code splitting.

## Remaining visual debt

Some older operational pages still use inline styles, Tailwind-only cards, raw tables, and page-specific modal markup. The shared safeguards prevent the severe screenshot-level defects—oversized controls, clipped tables, overflowing dialogs, and bottom-action collisions—but a subsequent visual-refactor tranche should migrate those legacy pages to PageHeader, SectionCard, DataTable, shared Button, Modal, FormField, and shared checkbox/toggle primitives so the entire product has one design language rather than merely one safe responsive baseline.
