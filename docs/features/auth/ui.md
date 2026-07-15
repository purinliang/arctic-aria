# User UI

This document describes user-visible auth UI behavior. Product rules,
validation, and persistence behavior are documented in [design.md](design.md).

## Session Loading State

- While the app checks the existing session, center the loading state on the
  page.
- Use the same brand row as the login and sidebar surfaces: Sparkles icon plus
  `Arctic Aria`.
- Show a visible loading spinner and the text `Opening your workspace...` in
  one horizontal row below the brand row.
- Do not show the login/register panel until the session check finishes.

## Registration Tab

- Keep the auth panel centered on the page.
- Show a centered brand row above the tabs as the first component. It should
  include a Sparkles icon and the text `Arctic Aria`.
- Show a centered description below the brand row, such as `Your personal life
  assistant under the aurora.`
- `Sign up` should be the right tab in a two-tab control. The other tab is
  `Sign in`.
- Below the tabs, stack the form vertically:
  - Show a title, such as `Create an account`.
  - Align field labels to the left.
  - Align text boxes to the left.
  - Show an error bubble with a tail pointing from the related text box.
  - The error bubble can overlay other components and should not affect layout
    height.
  - Required-empty bubbles, such as `Username can't be empty.`, should appear
    only after the user clicks the main `Sign up` or `Sign in` button.
  - Non-empty typing errors, such as length or character errors, can appear
    while the user types.
  - If a field is optional, show `(Optional)` beside its label. Required fields
    do not need extra label text.
  - Apply the same field layout rules to every field.
- The main button should say `Sign up` and include a right arrow icon to imply
  forward navigation.
- Empty required fields should not disable the main button before the first
  submit attempt. The first submit attempt should reveal the empty-field
  bubbles.
- When the main button is disabled by a non-empty typing error, hovering over it
  should show the first remaining validation error by rule priority.
- Show small text `Already have an account?` and link-style text `Sign in`.
  Clicking the link is equivalent to switching tabs.
- Do not show unrelated actions or information, such as `Open dashboard without
  an account` or `OAuth`.

## Login Tab

Use the same UI rules as registration, with these differences:

- `Sign in` should be the left tab in a two-tab control. The other tab is
  `Sign up`.
- The title below the tabs should say `Welcome back`.
- Show subtext `New here?` and link-style text `Sign up`.
- The main button should say `Sign in`.

Below the main button and above the bottom subtexts, show a separate line:

- `--- or ---`

Then show a placeholder Google action:

- Google logo
- `Continue with Google`
- Clicking it should show a shared info notification that Google sign-in is not
  implemented yet.

Also show a placeholder password reset line above `New here? Sign up`:

- `Forgot your password?`
- link-style text `Reset password`
- Clicking it should show a shared info notification that password reset is not
  implemented yet.
