import { CoreApp } from '@grafana/data';
import { QueryOptionGroup } from '@grafana/plugin-ui';
import { RadioButtonGroup, Field } from '@grafana/ui';

import { type Query } from '../types';

export interface Props {
  query: Query;
  onQueryTypeChange: (val: Query['queryType']) => void;
  app?: CoreApp;
}

const rangeOptions: Array<{ value: Query['queryType']; label: string; description: string }> = [
  { value: 'metrics', label: 'Metric', description: 'Return aggregated metrics' },
  { value: 'profile', label: 'Profile', description: 'Return profile' },
  { value: 'both', label: 'Both', description: 'Return both metric and profile data' },
];

function getOptions(app?: CoreApp) {
  if (app === CoreApp.Explore) {
    return rangeOptions;
  }
  return rangeOptions.filter((option) => option.value !== 'both');
}

export function QueryOptions({ query, onQueryTypeChange, app }: Props) {
  const options = getOptions(app);

  return (
    <QueryOptionGroup title="Options" collapsedInfo={[`Type: ${query.queryType}`]}>
      <Field label="Query Type">
        <RadioButtonGroup options={options} value={query.queryType} onChange={onQueryTypeChange} />
      </Field>
    </QueryOptionGroup>
  );
}
