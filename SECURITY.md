# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub: on the repository's **Security** tab, choose **Report a vulnerability**. Include what you found, how to reproduce it, and the impact you expect. Only the maintainer can see the report.

You can expect:

| Step | Within |
| --- | --- |
| Acknowledgement | 3 working days |
| Initial assessment and severity | 7 working days |
| Fix or mitigation for high and critical issues | 30 days, with you kept informed |

We will credit you in the release notes unless you prefer otherwise.

## Supported versions

| Version | Supported |
| --- | --- |
| Latest release on `main` | Yes |
| Older releases | No. Fixes ship as a new patch release (see the hotfix process in `CONTRIBUTING.md`) |

## Scope

This is a demonstration project. The Docker image serves mocked data and has no authentication or real customer data (see the residual risks in [`docs/discovery/threat-model.md`](docs/discovery/threat-model.md)). Reports are still welcome for anything that would matter in a real deployment, for example:

- cross-site scripting or other injection through API data or URL parameters
- weaknesses in the Content Security Policy or security headers
- personal or financial data exposed in URLs, logs or browser storage
- issues in the container image or the CI pipeline

## How the project is protected

- **Threat model:** [`docs/discovery/threat-model.md`](docs/discovery/threat-model.md) lists the threats and the test that proves each mitigation.
- **Every pull request** runs `npm audit`, registry signature verification, CodeQL (code and workflows) and a Trivy scan of the image. They also run weekly, because new advisories appear for unchanged code.
- **Dependabot** proposes updates weekly, after a short cooldown that protects against hijacked releases. Security updates are raised immediately.
- **Secret scanning with push protection** blocks commits that contain credentials.
- **Supply chain:** actions are pinned to commit SHAs and base images to digests, CI installs with lifecycle scripts disabled, and workflow tokens are read-only by default.
