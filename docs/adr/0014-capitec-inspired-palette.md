# 14. Capitec-inspired colours, with accessible variants

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

The assessment is for Capitec. A dashboard in the bank's own colours shows that the work was done for this team, and that brand and accessibility were reconciled the way they must be in a real product.

Two constraints pull the other way:

1. **Accessibility.** WCAG AA needs 4.5:1 for text and 3:1 for focus indicators, control borders and meaningful graphics (NFR A4). Bright brand colours often fail these on white.
2. **Impersonation.** This repository is public. A page that looks like an official Capitec app, with the bank's name or logo, is what phishing kits look like, and is not something a bank's security team wants to see from a candidate.

The palette was taken from Capitec's logo, as listed by a logo-colour site, not from an official brand guide, so the values are approximations. Their contrast on white, measured:

| Colour | Hex | On white |
| --- | --- | --- |
| Prussian blue | `#004973` | 9.54:1 |
| Brand blue | `#0084BB` | 4.18:1 |
| Red | `#EB423E` | 3.90:1 |
| Near-black | `#3B3532` | 12.06:1 |

Options considered:

1. **A neutral palette.** No impersonation risk and no contrast trade-offs, but no visible connection to the audience.
2. **Capitec's colours used as they are.** Recognisable, but the brand blue and red would fail contrast wherever they carried text.
3. **Capitec-inspired colours with accessible variants.** Use each brand colour where it passes, and a darker or lighter shade of the same hue where it does not.

## Decision

Option 3.

- **Light theme.** Prussian blue for the header, buttons and links, with white text on it (9.54:1). Near-black for body text. The brand blue is used for the focus ring and graphics (3:1 is enough there) but never for text. The red is an accent only. Status colours (on track, close to limit, over budget) are darker shades chosen to pass.
- **Dark theme.** Prussian blue reaches only 1.89:1 on a dark background, so the dark theme uses lighter tints of the same blues and red. It follows the system preference.
- **Tested.** `src/app/styles/tokens.test.ts` reads `tokens.css` and checks every colour pair the UI combines, in both themes. A colour change that breaks contrast fails CI.
- **Not impersonation.** No Capitec name, logo, typeface or wording appears in the app. The product is called "Spending Insights", and the README states that the project is not affiliated with Capitec.

## Consequences

- The dashboard is recognisably in the bank's palette without claiming to be the bank.
- Some brand colours are used less than a designer might like, for example the brand blue never appears as text. In a real team, the right step is to agree accessible variants with the brand team and add them to the design system.
- If the bank's official tokens became available, only `tokens.css` would change, and the contrast test would check the new values.
