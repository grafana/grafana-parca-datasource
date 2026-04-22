import { test, expect } from '@grafana/plugin-e2e';

import { ParcaDataSourceOptions } from '../../src/types';

test.describe('Config editor', () => {
  test.describe('rendering', () => {
    test(
      'smoke: should render config editor',
      { tag: '@plugins' },
      async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
        const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
        await createDataSourceConfigPage({ type: ds.type });
        await expect(page.getByRole('heading', { name: 'Connection', exact: true })).toBeVisible();
      }
    );

    test('should render Connection URL field', async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      await createDataSourceConfigPage({ type: ds.type });
      await expect(page.getByRole('textbox', { name: 'Data source connection URL' })).toBeVisible();
    });

    test('should render Authentication section', async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      await createDataSourceConfigPage({ type: ds.type });
      await expect(page.getByRole('heading', { name: 'Authentication', exact: true })).toBeVisible();
    });

    test('should render Additional settings section', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      page,
    }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      await createDataSourceConfigPage({ type: ds.type });
      await expect(page.getByRole('heading', { name: 'Additional settings', exact: true })).toBeVisible();
    });
  });

  test.describe('provisioned datasource', () => {
    test('should load provisioned config page', async ({ gotoDataSourceConfigPage, readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      await gotoDataSourceConfigPage(ds.uid);
      await expect(page.getByRole('heading', { name: 'Connection', exact: true })).toBeVisible();
    });

    test('should show provisioned URL', async ({ gotoDataSourceConfigPage, readProvisionedDataSource, page }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      await gotoDataSourceConfigPage(ds.uid);
      await expect(page.getByRole('textbox', { name: 'Data source connection URL' })).toHaveValue(
        ds.url ?? ''
      );
    });
  });

  test.describe('save & test', () => {
    test('should pass health check when backend returns success', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      page,
    }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      const configPage = await createDataSourceConfigPage({ type: ds.type });
      await page.route('**/api/datasources/uid/*/health', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'OK', message: 'Data source is working' }),
        })
      );
      await page.getByRole('textbox', { name: 'Data source connection URL' }).fill('http://localhost:7070');
      await expect(configPage.saveAndTest()).toBeOK();
    });

    test('should show error alert when health check fails', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      page,
    }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      const configPage = await createDataSourceConfigPage({ type: ds.type });
      await page.route('**/api/datasources/uid/*/health', (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'connection refused' }),
        })
      );
      await page.getByRole('textbox', { name: 'Data source connection URL' }).fill('http://localhost:7070');
      await expect(configPage.saveAndTest()).not.toBeOK();
      await expect(configPage).toHaveAlert('error');
    });

    test('should show error alert when backend is unreachable', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      page,
    }) => {
      const ds = await readProvisionedDataSource<ParcaDataSourceOptions>({ fileName: 'datasources.yml' });
      const configPage = await createDataSourceConfigPage({ type: ds.type });
      await page.getByRole('textbox', { name: 'Data source connection URL' }).fill('http://localhost:1');
      await expect(configPage.saveAndTest()).not.toBeOK();
    });
  });
});
