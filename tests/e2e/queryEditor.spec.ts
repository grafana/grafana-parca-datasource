import { test, expect } from '@grafana/plugin-e2e';

const PLUGIN_TYPE = 'parca';

function exploreUrl(uid: string, opts?: { profileTypeId?: string; labelSelector?: string; queryType?: string }): string {
  const query: Record<string, unknown> = {
    refId: 'A',
    datasource: { type: PLUGIN_TYPE, uid },
    labelSelector: opts?.labelSelector ?? '{}',
    queryType: opts?.queryType ?? 'both',
  };
  if (opts?.profileTypeId) {
    query.profileTypeId = opts.profileTypeId;
  }
  const panes = JSON.stringify({
    explore: {
      datasource: uid,
      queries: [query],
      range: { from: 'now-1h', to: 'now' },
    },
  });
  return `/explore?orgId=1&schemaVersion=1&panes=${encodeURIComponent(panes)}`;
}

test.describe('Query editor', () => {
  test(
    'smoke: should render query editor',
    { tag: '@plugins' },
    async ({ page, readProvisionedDataSource }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await page.goto(exploreUrl(ds.uid));
      await expect(page.getByRole('button', { name: 'Select a profile type' })).toBeVisible();
    }
  );

  test('should render label selector editor', async ({ page, readProvisionedDataSource }) => {
    const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
    await page.goto(exploreUrl(ds.uid));
    await expect(page.getByRole('textbox', { name: /Editor content/ })).toBeVisible();
  });

  test('should populate label selector with default value {}', async ({ page, readProvisionedDataSource }) => {
    const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
    await page.goto(exploreUrl(ds.uid));
    await expect(page.getByRole('textbox', { name: /Editor content/ })).toHaveValue('{}');
  });

  test('should render Options section', async ({ page, readProvisionedDataSource }) => {
    const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
    await page.goto(exploreUrl(ds.uid));
    await expect(page.getByRole('button', { name: /Options/ })).toBeVisible();
  });

  test.describe('Query type options', () => {
    test('should show Metric, Profile and Both options in Options section', async ({
      page,
      readProvisionedDataSource,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await page.goto(exploreUrl(ds.uid));
      await page.getByRole('button', { name: /Options/ }).click();
      await expect(page.getByRole('radio', { name: 'Metric' })).toBeVisible();
      await expect(page.getByRole('radio', { name: 'Profile' })).toBeVisible();
      await expect(page.getByRole('radio', { name: 'Both' })).toBeVisible();
    });

    test('should default to "Both" query type in Explore', async ({ page, readProvisionedDataSource }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await page.goto(exploreUrl(ds.uid));
      await page.getByRole('button', { name: /Options/ }).click();
      await expect(page.getByRole('radio', { name: 'Both' })).toBeChecked();
    });

    test('should switch to Metric query type', async ({ page, readProvisionedDataSource }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await page.goto(exploreUrl(ds.uid));
      await page.getByRole('button', { name: /Options/ }).click();
      await page.getByRole('radio', { name: 'Metric' }).click();
      await expect(page.getByRole('radio', { name: 'Metric' })).toBeChecked();
    });

    test('should switch to Profile query type', async ({ page, readProvisionedDataSource }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await page.goto(exploreUrl(ds.uid));
      await page.getByRole('button', { name: /Options/ }).click();
      await page.getByRole('radio', { name: 'Profile' }).click();
      await expect(page.getByRole('radio', { name: 'Profile' })).toBeChecked();
    });
  });

  test.describe('query execution', () => {
    test('should return no data when profile type is not selected', async ({ page, readProvisionedDataSource }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      // Without a profileTypeId the datasource short-circuits and returns empty data immediately,
      // so no /api/ds/query request is made and the panel shows "No data".
      await page.goto(exploreUrl(ds.uid));
      await expect(page.getByText('No data')).toBeVisible({ timeout: 15000 });
    });

    test('should send query request when profile type is selected', async ({
      page,
      explorePage,
      readProvisionedDataSource,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });

      // Mock /api/ds/query so the test does not need a live Parca backend.
      await page.route('**/api/ds/query*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: { A: { frames: [] } } }),
        })
      );

      // TODO: remove the body-reading workaround once @grafana/plugin-e2e exposes it natively.
      let body: Record<string, unknown> | null = null;
      const responsePromise = explorePage.waitForQueryDataResponse(async (r) => {
        if (!r.ok()) {
          return false;
        }
        const b: any = await r.json().catch(() => null);
        if (!b?.results?.A) {
          return false;
        }
        body = b;
        return true;
      });

      await page.goto(exploreUrl(ds.uid, { profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds' }));
      await responsePromise;
      expect(body).not.toBeNull();
    });

    test('should send query with custom label selector', async ({
      page,
      explorePage,
      readProvisionedDataSource,
    }) => {
      test.skip(
        !process.env.CI && !process.env.DS_INSTANCE_HOST,
        'Requires a reachable Parca backend; set DS_INSTANCE_HOST or run in CI'
      );

      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      let body: Record<string, unknown> | null = null;
      const responsePromise = explorePage.waitForQueryDataResponse(async (r) => {
        if (!r.ok()) {
          return false;
        }
        const b: any = await r.json().catch(() => null);
        if (!b?.results?.A) {
          return false;
        }
        body = b;
        return true;
      });
      await page.goto(
        exploreUrl(ds.uid, {
          profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
          labelSelector: '{namespace="default"}',
          queryType: 'metrics',
        })
      );
      await responsePromise;
      expect(body).not.toBeNull();
    });
  });
});
