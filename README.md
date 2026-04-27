# Parca data source for Grafana

> **Note**: This core plugin was extracted from the
> [grafana/grafana](https://github.com/grafana/grafana) repository and is now
> developed and released from this repository.

## Overview

[Parca](https://www.parca.dev/) is an open-source continuous profiling
project. The Parca data source plugin lets Grafana query and visualize CPU,
memory, and other profiles stored in a Parca server, so engineers can
investigate performance regressions alongside metrics, logs, and traces.

This repository hosts the standalone Parca plugin built from `pkg/main.go`
and the frontend in `src/`, distributed through the Grafana plugin catalog.

## Requirements

- Grafana 12.3.0 or later (see `dependencies.grafanaDependency` in
  [`src/plugin.json`](./src/plugin.json)).

## Getting started

This plugin is bundled with Grafana — no installation is required for standard Grafana deployments.

1. Navigate to **Connections > Data sources** in Grafana.
2. Click **Add data source** and search for "Parca".
3. Configure the connection settings and click **Save & test**.

For detailed setup instructions, see the
[Parca data source documentation](https://grafana.com/docs/grafana/latest/datasources/parca/).

### Custom Grafana distributions

If you are building a custom Grafana binary or distribution that excludes bundled plugins,
you can install this plugin from the [Grafana plugin catalog](https://grafana.com/grafana/plugins/).

## Documentation

Full documentation is available at:

https://grafana.com/docs/grafana/latest/datasources/parca/

## Issues

Please report bugs and feature requests at
[grafana/grafana-parca-datasource/issues](https://github.com/grafana/grafana-parca-datasource/issues/new).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This plugin is licensed under the [AGPL-3.0](LICENSE).
