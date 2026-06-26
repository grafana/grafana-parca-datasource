# Contributing

> **Deprecation notice**: This plugin is scheduled for deprecation on 2nd of January 2027 and will no longer receive updates after that time.

Thank you for your interest in contributing to the Parca data source for Grafana! We welcome contributions from the community.

Feel free to [browse open issues](https://github.com/grafana/grafana-parca-datasource/issues) or open a new one. For more general guidance, see [Grafana's Contributing Guide](https://github.com/grafana/grafana/blob/main/CONTRIBUTING.md).

This project adheres to the [Grafana Code of Conduct](https://github.com/grafana/grafana/blob/main/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Prerequisites

| Tool                              | Notes                                    |
| --------------------------------- | ---------------------------------------- |
| [Git](https://git-scm.com/)       | Version control                          |
| [Go](https://go.dev/)             | See `go.mod` for minimum version         |
| [Mage](https://magefile.org/)     | Backend build tool                       |
| [Node.js LTS](https://nodejs.org) | See `.nvmrc` for the pinned version      |
| [npm](https://www.npmjs.com/)     | See `package.json` for minimum version   |
| [Docker](https://www.docker.com/) | Required for local Grafana and e2e tests |

## Development

For full setup instructions, including how to run against a local [grafana/grafana](https://github.com/grafana/grafana) checkout and how to deploy the built plugin to a Kubernetes-based Grafana instance, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Frontend

1. Install dependencies:

   ```shell
   npm install
   ```

2. Build plugin in development mode and watch for changes:

   ```shell
   npm run dev
   ```

3. Build plugin in production mode:

   ```shell
   npm run build
   ```

4. Run frontend tests:

   ```shell
   npm run test:ci
   ```

## Backend

Build the backend binaries for your platform:

```shell
mage build:darwinARM64  # Apple Silicon
mage build:linux        # Linux amd64
mage -v                 # all platforms
```

## Local development environment

`npm run server` starts a local Parca instance and a Grafana instance with the plugin pre-provisioned:

```shell
npm run server
```

## E2E tests

```shell
npm run server
npm run e2e
```

Or, to install Playwright browsers first:

```shell
npx playwright install --with-deps
npm run server
npm run e2e
```

## Release

You need commit access to the repository to publish a release.

1. Update the version number in `package.json`.
2. Update `CHANGELOG.md` with the changes included in the release.
3. Open a PR with the changes and merge it.
4. Follow the release process described [here](https://enghub.grafana-ops.net/docs/default/component/grafana-plugins-platform/plugins-ci-github-actions/010-plugins-ci-github-actions/#cd_1).
