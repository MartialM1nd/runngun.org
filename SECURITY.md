# Security Policy

Run & Gun takes the security of its users, Nostr identities, and published event data seriously. We welcome good-faith reports that help us improve the application.

## Supported Versions

Run & Gun is continuously deployed. Security fixes are made on the default branch and released through the latest deployment; older commits, forks, and third-party deployments are not supported.

| Version | Supported |
|---|---|
| Default branch and current deployment | Yes |
| Older commits and third-party deployments | No |

## Reporting a Vulnerability

Do not open a public issue, discussion, or pull request for a suspected vulnerability.

Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/awstephan/runngun.org/security/advisories/new). If GitHub private reporting is unavailable, contact the repository owner through their GitHub profile without including sensitive details in a public message.

Include as much of the following as possible:

- A clear description of the vulnerability and its impact
- The affected URL, component, commit, or deployment
- Reproduction steps or a minimal proof of concept
- Required account, signer, relay, browser, or wallet conditions
- Whether the issue has been disclosed elsewhere
- Any suggested mitigation

Never include Nostr private keys (`nsec` values), wallet credentials, NWC connection strings, access tokens, or other secrets. Use test identities and test funds when demonstrating an issue.

You should receive an acknowledgement within 3 business days and an initial assessment within 7 business days. Remediation timelines depend on severity and complexity. We will provide updates when the assessment changes or a fix is ready. If a report is declined, we will explain why when practical.

## Scope

Examples of issues that are in scope include:

- Bypassing Site Owner or Trusted Admin authorization
- Accepting forged or incorrectly attributed Nostr events as trusted content
- Missing author constraints on privileged or addressable-event queries
- Cross-site scripting, unsafe URL handling, or Content Security Policy bypasses
- Exposure of signer, wallet, NWC, or other sensitive data
- Unauthorized event creation, modification, or deletion
- Vulnerabilities in the deployed application or RSS generation pipeline
- Dependency vulnerabilities with a demonstrated impact on Run & Gun

The following are generally out of scope unless they demonstrate a concrete impact on this project:

- Spam, misleading content, or events published by untrusted Nostr users
- Relay availability, censorship, retention, or behavior outside our control
- Vulnerabilities in browser extensions, wallets, relays, Blossom servers, or other third-party services
- Social engineering, phishing, or physical attacks
- Automated scanner output without a reproducible vulnerability
- Denial-of-service testing, traffic flooding, or resource exhaustion
- Reports that require a victim to disclose an `nsec`, wallet secret, or other credential

Nostr is a permissionless network: the ability to publish an event is not itself an authorization bypass. Reports should show where the application incorrectly treats untrusted data or an untrusted author as authoritative.

## Coordinated Disclosure

Please allow us a reasonable opportunity to investigate and remediate a vulnerability before public disclosure. Coordinate publication timing through the private advisory. We may credit reporters in an advisory or release note with their consent.

This project does not currently offer a bug bounty or guarantee payment for reports.

## Safe Harbor

We will not pursue legal action for good-faith research that:

- Avoids privacy violations, data destruction, service disruption, and harm to users
- Uses only accounts, Nostr identities, wallets, and data you own or have permission to test
- Does not access, retain, or disclose more data than necessary to demonstrate the issue
- Stops testing and reports promptly if sensitive data is encountered
- Complies with applicable law and this policy

This safe harbor applies only to systems maintained by this project. Third-party services have their own policies and authorization requirements.
