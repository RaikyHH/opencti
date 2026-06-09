import { useState, useMemo, ReactNode, CSSProperties } from 'react';
import { graphql } from 'react-relay';
import { QueryRenderer } from '../../../../relay/environment';
import { useFormatter } from '../../../../components/i18n';
import { monthsAgo, now } from '../../../../utils/Time';
import { buildFiltersAndOptionsForWidgets } from '../../../../utils/filters/filtersUtils';
import WidgetContainer from '../../../../components/dashboard/WidgetContainer';
import WidgetNoData from '../../../../components/dashboard/WidgetNoData';
import WidgetVerticalBars from '../../../../components/dashboard/WidgetVerticalBars';
import Loader, { LoaderVariant } from '../../../../components/Loader';
import useDashboardViz from '../../../../components/dashboard/useDashboardViz';
import WidgetNoHostEntity from '../../../../components/dashboard/WidgetNoHostEntity';
import type { WidgetDataSelection, WidgetHost, WidgetParameters } from '../../../../utils/widget/widget';
import { DraftsMultiVerticalBarsTimeSeriesQuery$data } from './__generated__/DraftsMultiVerticalBarsTimeSeriesQuery.graphql';

const draftsMultiVerticalBarsTimeSeriesQuery = graphql`
  query DraftsMultiVerticalBarsTimeSeriesQuery(
    $field: String!
    $operation: StatsOperation!
    $startDate: DateTime!
    $endDate: DateTime!
    $interval: String!
    $filters: FilterGroup
    $search: String
  ) {
    draftWorkspacesTimeSeries(
      field: $field
      operation: $operation
      startDate: $startDate
      endDate: $endDate
      interval: $interval
      filters: $filters
      search: $search
    ) {
      date
      value
    }
  }
`;

const DraftsMultiVerticalBars = ({
  variant,
  height,
  startDate,
  endDate,
  dataSelection,
  parameters = {},
  popover,
  host,
}: {
  variant?: string;
  height?: CSSProperties['height'];
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  dataSelection: WidgetDataSelection[];
  parameters?: WidgetParameters;
  popover?: ReactNode;
  host?: WidgetHost;
}) => {
  const { t_i18n } = useFormatter();
  const [chart, setChart] = useState<ApexCharts>();
  const { resolvedDataSelection, isMissingHostEntity, isPreviewMode } = useDashboardViz({
    perspective: 'entities',
    dataSelection,
    host,
  });

  const fallbackDates = useMemo(() => ({
    start: monthsAgo(12),
    end: now(),
  }), []);

  const selection = resolvedDataSelection[0];
  const { filters } = useMemo(() => buildFiltersAndOptionsForWidgets(selection?.filters), [selection]);

  const variables = useMemo(() => ({
    field: selection?.date_attribute && selection.date_attribute.length > 0
      ? selection.date_attribute
      : 'created_at',
    operation: 'count',
    startDate: startDate ?? fallbackDates.start,
    endDate: endDate ?? fallbackDates.end,
    interval: parameters.interval ?? 'day',
    filters,
  }), [startDate, endDate, fallbackDates, parameters.interval, selection, filters]);

  const renderContent = () => {
    if (isMissingHostEntity) {
      return <WidgetNoHostEntity host={host} />;
    }
    return (
      <QueryRenderer
        query={draftsMultiVerticalBarsTimeSeriesQuery}
        variables={variables}
        render={({ props }: { props: DraftsMultiVerticalBarsTimeSeriesQuery$data }) => {
          if (props && props.draftWorkspacesTimeSeries) {
            return (
              <WidgetVerticalBars
                series={[{
                  name: selection?.label || t_i18n('Number of draft workspaces'),
                  data: props.draftWorkspacesTimeSeries.map((entry) => ({
                    x: new Date(entry?.date),
                    y: entry?.value,
                  })),
                }]}
                interval={parameters.interval}
                isStacked={parameters.stacked ?? undefined}
                hasLegend={parameters.legend ?? undefined}
                onMounted={setChart}
              />
            );
          }
          if (props) {
            return <WidgetNoData />;
          }
          return <Loader variant={LoaderVariant.inElement} />;
        }}
      />
    );
  };

  return (
    <WidgetContainer
      padding="small"
      height={height}
      title={parameters.title ?? t_i18n('Draft workspaces history')}
      variant={variant}
      chart={chart}
      action={popover}
      showPreviewTag={isPreviewMode}
    >
      {renderContent()}
    </WidgetContainer>
  );
};

export default DraftsMultiVerticalBars;
