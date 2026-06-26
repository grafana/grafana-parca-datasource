# Development

> **Deprecation notice**: This plugin is scheduled for deprecation on 2nd of January 2027 and will no longer receive updates after that time.

## Prerequisites

| Tool                              | Notes                                    |
| --------------------------------- | ---------------------------------------- |
| [Git](https://git-scm.com/)       | Version control                          |
| [Go](https://go.dev/)             | See `go.mod` for minimum version         |
| [Mage](https://magefile.org/)     | Backend build tool                       |
| [Node.js LTS](https://nodejs.org) | See `.nvmrc` for the pinned version      |
| [npm](https://www.npmjs.com/)     | See `package.json` for minimum version   |
| [Docker](https://www.docker.com/) | Required for local Grafana and e2e tests |

## Getting started

```bash
npm install
npm run build
```

## Project structure

| Path            | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `src/`          | Plugin frontend source (webpack-built, bundled into the Grafana plugin zip) |
| `pkg/`          | Go backend source                                                           |
| `provisioning/` | Grafana provisioning config used by the local Docker setup                  |
| `playwright/`   | E2E test fixtures and helpers                                               |
| `.config/`      | Grafana plugin tooling config — **do not modify** (managed by `@grafana/plugin-tools`) |

## Running locally

The `npm run server` command starts both a local [Parca](https://www.parca.dev/) instance and a Grafana instance with the plugin pre-provisioned and ready to use:

```bash
npm run server
```

Grafana will be available at `http://localhost:3000` (default credentials: `admin` / `admin`). The Parca backend will be reachable at `http://localhost:7070`.

To pin a specific Grafana version, set `GRAFANA_VERSION`:

```bash
GRAFANA_VERSION=11.6.0 npm run server
```

## Running locally against a local grafana/grafana checkout

If you want to develop against a local build of Grafana itself rather than the Docker image, follow these steps.

### 1. Set up the Grafana repository

Clone [grafana/grafana](https://github.com/grafana/grafana) somewhere in your workspace, for example next to this repository:

```
workspace/
  grafana/          ← grafana/grafana checkout
  plugins/
    grafana-parca-datasource/   ← this repo
```

### 2. Create a `custom.ini`

Grafana's [defaults.ini](https://github.com/grafana/grafana/blob/main/conf/defaults.ini#L25-L26) looks for additional plugins in `data/plugins`. It is cleaner to keep your plugin repos in a dedicated directory (e.g. `workspace/plugins`) and point Grafana there with a `custom.ini` file instead of touching `defaults.ini`.

Create `conf/custom.ini` next to `conf/defaults.ini` in the grafana/grafana repo and add at minimum:

```ini
app_mode = development
force_migration = true

[paths]
plugins = /your/workspace/plugins

[feature_toggles]
externalCorePlugins = true

[plugin.parca]
as_external = true

[plugins]
allow_loading_unsigned_plugins = parca

[log]
level = debug
```

> **Why `externalCorePlugins` and `as_external`?** Parca is a _core_ plugin bundled inside Grafana. These flags tell Grafana to load your local checkout instead of its own bundled copy.

### 3. Start Parca

The plugin needs a live Parca backend to connect to. Start one with Docker:

```bash
docker run --rm -p 7070:7070 ghcr.io/parca-dev/parca:latest
```

Or use `npm run server` from this repo (which starts Parca via docker compose) and configure your grafana/grafana instance to point at `http://localhost:7070`.

### 4. Start Grafana

Start grafana/grafana with `yarn install && yarn start` for the frontend in one terminal and `make run` for the backend in another. Grafana will use the plugin from `workspace/plugins/grafana-parca-datasource`, and you can iterate on frontend or backend changes directly.

### 5. Build the plugin

**Backend** — build the Go binary for your platform. On Apple Silicon:

```bash
mage build:darwinARM64
```

On Intel Mac or Linux x86-64:

```bash
mage build:linux
# or
mage build:darwin
```

Run `mage -v` with no target to build for all supported platforms. You must re-run this after every backend change. To tell Grafana to pick up the new binary without a full restart:

```bash
mage reloadPlugin
```

**Frontend** — install dependencies and start watch mode:

```bash
npm install
npm run dev
```

`npm run dev` starts an incremental webpack build that picks up frontend changes automatically.

---

## Using the built plugin with a Grafana instance on Kubernetes

If you want to test a locally built version of the plugin against a Grafana instance running on Kubernetes (for example, a dev cluster), follow the steps below.

### 1. Build the plugin for distribution

Build the frontend for production and compile the backend binaries for all platforms:

```bash
npm run build
mage buildAll
```

This produces a `dist/` directory containing the compiled frontend assets and platform-specific backend binaries (`gpx_parca-datasource_linux_amd64`, `gpx_parca-datasource_linux_arm64`, etc.).

### 2. Package the plugin

Zip the `dist/` directory for upload:

```bash
zip -r grafana-parca-datasource.zip dist/
```

### 3. Load the plugin into Grafana on Kubernetes

There are two common approaches:

#### Option A: Init container (recommended for testing)

Use an init container to copy the plugin zip into the Grafana pod's plugin volume before Grafana starts.

Add this to your Helm `values.yaml` (using the [Grafana Helm chart](https://github.com/grafana/helm-charts/tree/main/charts/grafana)):

```yaml
extraInitContainers:
  - name: install-parca-plugin
    image: busybox
    command:
      - sh
      - -c
      - |
        wget -O /tmp/parca-plugin.zip https://<your-artifact-url>/grafana-parca-datasource.zip
        unzip /tmp/parca-plugin.zip -d /var/lib/grafana/plugins/
    volumeMounts:
      - name: storage
        mountPath: /var/lib/grafana

grafana.ini:
  feature_toggles:
    externalCorePlugins: true
  plugin.parca:
    as_external: true
  plugins:
    allow_loading_unsigned_plugins: parca
```

#### Option B: ConfigMap or PVC with pre-loaded plugin files

Copy the `dist/` directory into a PersistentVolumeClaim or ConfigMap that is mounted at Grafana's plugin path (`/var/lib/grafana/plugins/parca/`).

In your Helm values:

```yaml
plugins: []  # disable built-in plugin auto-install

extraVolumes:
  - name: parca-plugin
    persistentVolumeClaim:
      claimName: parca-plugin-pvc

extraVolumeMounts:
  - name: parca-plugin
    mountPath: /var/lib/grafana/plugins/parca

grafana.ini:
  feature_toggles:
    externalCorePlugins: true
  plugin.parca:
    as_external: true
  plugins:
    allow_loading_unsigned_plugins: parca
```

### 4. Configure the datasource

Add a datasource provisioning ConfigMap so Grafana automatically picks up the Parca datasource:

```yaml
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Parca
        type: parca
        uid: parca
        url: http://<parca-service>:<port>  # e.g. http://parca.monitoring:7070
        access: proxy
        isDefault: false
        editable: true
```

Replace `<parca-service>:<port>` with the in-cluster address of your [Parca](https://www.parca.dev/) deployment.

> **Note**: Parca must be reachable from within the cluster. If you are running Parca outside the cluster, configure a Service of type `ExternalName` or use port-forwarding during development (`kubectl port-forward svc/parca 7070:7070`).

---

## Testing

```bash
npm run test:ci       # unit tests
npm run e2e           # playwright e2e tests (requires a running Grafana + Parca)
npm run lint          # eslint
npm run typecheck     # typescript type checking
```

For e2e tests, make sure Grafana is running first:

```bash
npm run server        # starts Grafana + Parca via docker compose
npm run e2e
```

Or install Playwright browsers before running e2e for the first time:

```bash
npx playwright install --with-deps
npm run server
npm run e2e
```
