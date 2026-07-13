# Contributing to Forgeng

Thanks for your interest in contributing! This guide covers how to get set
up and submit changes.

By participating in this project, you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting started

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/forgeng.git
   cd forgeng
   ```

2. Follow the [Setup](./README.md#setup) instructions in the README to
   install dependencies, configure PostgreSQL, and run migrations.

3. Create a branch off `main`:

   ```bash
   git checkout -b fix/short-description
   # or
   git checkout -b feat/short-description
   ```

   Use `fix/*` for bug fixes and `feat/*` for new functionality.

## Making changes

- Run `pnpm dev` to start both apps, or `pnpm dev:fe` / `pnpm dev:be`
  individually.
- Keep changes focused — one logical change per pull request.
- Run `pnpm lint` and `pnpm test` before pushing. A pre-commit hook (husky)
  also runs `lint:fix` and `lint` automatically.

## Submitting a pull request

1. Push your branch to your fork and open a pull request against `main` in
   `radcrew/forgeng`.
2. Give the PR a clear title and describe what changed and why.
3. Link any related issue.
4. Make sure CI is green before requesting review.

A maintainer will review your PR and may ask for changes before merging.

## Reporting bugs / requesting features

Please use the issue templates when opening a new issue — they help us
triage faster.

## Security issues

Do not open a public issue for security vulnerabilities — see
[SECURITY.md](./SECURITY.md) instead.

## Questions

If anything here is unclear, feel free to open a discussion/issue or reach
out at code@radcrew.org.
