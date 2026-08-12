# Security policy

## Protecting local secrets

Keep bot tokens, database URLs, and API keys in `.env`. The `.gitignore` file
already excludes `.env` from Git. Do not replace that rule with a real secret.

If a secret is accidentally committed:

1. Revoke or rotate it immediately with the provider.
2. Remove it from the working tree.
3. Rewrite Git history if the repository was already published.

## Reporting a vulnerability

Please avoid posting exploitable credentials or private security details in a
public issue. Contact the repository maintainer privately with the affected
feature, reproduction steps, and a suggested fix.