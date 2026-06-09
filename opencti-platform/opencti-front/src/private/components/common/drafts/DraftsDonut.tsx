import ApexCharts from 'apexcharts';
import { graphql } from 'react-relay';
import { CSSProperties, ReactNode, useState } from 'react';
import { QueryRenderer } from '../../../../relay/environment';
import { useFormatter } from '../../../../components/i18n';
import WidgetContainer from '../../../../components/dashboard/WidgetContainer';
import WidgetNoData from '../../../../components/dashboard/WidgetNoData';
import WidgetDonut from '../../../../components/dashboard/WidgetDonut';
import Loader, { LoaderVariant } from '../../../../components/Loader';
import useDashboardViz from '../../../../components/dashboard/useDashboardViz';
import WidgetNoHostEntity from '../../../../components/dashboard/WidgetNoHostEntity';
import type { WidgetDataSelection, WidgetHost, WidgetParameters } from '../../../../utils/widget/widget';
import { DraftsDonutDistributionQuery$data } from './__generated__/DraftsDonutDistributionQuery.graphql';

const draftsDonutDistributionQuery = graphql`
  query DraftsDonutDistributionQuery(
    $field: String!
    $startDate: DateTime
    $endDate: DateTime
    $dateAttribute: String
    $operation: StatsOperation!
    $limit: Int
    $order: String
    $filters: FilterGroup
    $search: String
  ) {
    draftWorkspacesDistribution(
      field: $field
      startDate: $startDate
      endDate: $endDate
      dateAttribute: $dateAttribute
      operation: $operation
      limit: $limit
      order: $order
      filters: $filters
      search: $search
    ) {
      label
      value
      entity {
        ... on BasicObject {
          id
          entity_type
        }
        ... on Creator {
          name
        }
        ... on Group {
          name
        }
      }
    }
  }
`;

const DraftsDonut = ({
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

  const renderContent = () => {
    if (isMissingHostEntity) {
      return <WidgetNoHostEntity host={host} />;
    }
    const selection = resolvedDataSelection[0];
    return (
      <QueryRenderer
        query={draftsDonutDistributionQuery}
        variables={{
          field: selection.attribute,
          operation: 'count',
          startDate,
          endDate,
          dateAttribute: selection.date_attribute && selection.date_attribute.length > 0
            ? selection.date_attribute
            : 'created_at',
          filters: selection.filters,
          limit: selection.number ?? 10,
        }}
        render={({ props }: { props: DraftsDonutDistributionQuery$data }) => {
          if (props && props.draftWorkspacesDistribution && props.draftWorkspacesDistribution.length > 0) {
            return (
              <WidgetDonut
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={props.draftWorkspacesDistribution as any[]}
                groupBy={selection.attribute || 'entity_type'}
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
      title={parameters.title ?? t_i18n('Distribution of draft workspaces')}
      variant={variant}
      chart={chart}
      action={popover}
      showPreviewTag={isPreviewMode}
    >
      {renderContent()}
    </WidgetContainer>
  );
};

export default DraftsDonut;
