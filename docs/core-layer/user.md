# User

This document defines the first user feature. It covers registration, login,
and future OAuth. User settings are documented separately in
[user-settings.md](user-settings.md).

## Scope

The first user feature should include:

- username and password registration
- username and password login
- password hashing
- basic validation and user-facing error messages

The first user feature should not include:

- Google OAuth
- changing display name
- changing password
- account deletion
- multi-factor authentication

## Attributes

Should be stored in the `users` SQL table.

- id
- username
- password hash
- display name
- created and updated timestamps

Do not store raw passwords. Password hashing secrets, salts, pepper values, and
environment variables must not be committed to git.

Use bcrypt for password hashing. Bcrypt handles per-password salts internally.
If a pepper value is added, it must come from an environment variable or secret
manager, not from tracked files.

## Registration

Progress: planned

Use `register` in code. The UI can say `Sign up`.

### Required fields

- username
- display name
- password
- repeated password

### Validation when typing

- Username is required.
- Username must be at least 4 characters.
- Username must contain visible non-blank ASCII characters only.
- Password is required.
- Password must be at least 8 characters.
- Password must contain visible non-blank ASCII characters only.
- Password and repeated password must match.
- Display name is optional.
- If display name is provided, it must be at least 4 characters.
- Display name should support UTF-8.
- Display name should be trimmed before validation.
- Display name can contain spaces and other blank characters inside the trimmed
  value.
- Display name should be no longer than 32 characters.

When a typing validation rule fails:

- The UI should show a field-level error near the matching input.
- The user can type invalid characters, but the UI should respond immediately
  with a hint so the user understands what is wrong.
- If multiple rules fail for the same field, show the first rule in the order
  listed above.
- The confirm button should be disabled while any typing validation rule fails.

### Validation when submitting

- Trim all fields before backend validation.
- Run all typing validation rules again on the backend to protect against
  frontend mistakes or request tampering.
- Username must be unique.
- If display name is empty, use the username as the display name.

When a submit validation rule fails:

- Show an error dialog or toast separate from field-level typing hints.
- Keep the user on the current page.
- Preserve the user's input except for password fields if the implementation
  chooses to clear them for safety.
- If multiple rules fail, show the first rule in the order listed above.

When registration succeeds:

- Show a small dialog or toast.
- After about 2 seconds, dismiss the notification and navigate to the dashboard
  or main page.

For success, validation failure, and internal failure, both frontend and backend
should write useful logs. Logs must not include raw passwords or other sensitive
values.

### UI

- Keep the auth panel centered on the page.
- Do not show a title above the tabs. The tabs are the first component.
- `Sign up` should be the right tab in a two-tab control. The other tab is
  `Sign in`.
- Below the tabs, stack the form vertically:
  - Show a title, such as `Create an account`.
  - Align field labels to the left.
  - Align text boxes to the left.
  - Show an error bubble with a tail pointing from the related text box.
  - The error bubble can overlay other components and should not affect layout
    height.
  - The error bubble should appear only after the user has focused the field at
    least once. If the user has not focused an empty required field, do not show
    the field-level bubble yet.
  - If a field is optional, show `(Optional)` beside its label. Required fields
    do not need extra label text.
  - Apply the same field layout rules to every field.
- The main button should say `Sign up` and include a right arrow icon to imply
  forward navigation.
- When the main button is disabled, hovering over it should show the first
  remaining validation error by rule priority. This includes hidden errors for
  untouched fields, such as `Username is required`.
- Show small text `Already have an account?` and link-style text `Sign in`.
  Clicking the link is equivalent to switching tabs.
- Do not show unrelated actions or information, such as `Open dashboard without
  an account` or `OAuth`.

## Login

Progress: planned

Use `login` in code. The UI can say `Sign in`.

### Required fields

- username
- password

### Validation when typing

- Username is required.
- Password is required.
- Username and password should use the same validation rules and messages as
  registration for format violations.

Use the same typing validation behavior as registration.

### Validation when submitting

- Run all typing validation rules again on the backend to protect against
  frontend mistakes or request tampering.
- Failed login should show a clear but generic error, such as invalid username
  or password.

Use the same submit validation behavior as registration.

### UI

Use the same UI rules as registration, with these differences:

- `Sign in` should be the left tab in a two-tab control. The other tab is
  `Sign up`.
- Show text `New here?` and link-style text `Sign up`.
- The main button should say `Sign in`.

## OAuth

Progress: suspended

Google OAuth can be added later. It should not block the first username and
password implementation.
