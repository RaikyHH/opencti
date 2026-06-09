import { CSSProperties, ReactNode, useRef } from 'react';
import { graphql } from 'react-relay';
import { useFormatter } from '../../../../components/i18n';
import { QueryRenderer } from '../../../../relay/environment';
import { buildFiltersAndOptionsForWidgets } from '../../../../utils/filters/filtersUtils';
import WidgetContainer from '../../../../components/dashboard/WidgetContainer';
import WidgetNoData from '../../../../components/dashboard/WidgetNoData';
import WidgetListCoreObjects from '../../../../components/dashboard/WidgetListCoreObjects';
import Loader, { LoaderVariant } from '../../../../components/Loader';
import useDashboardViz from '../../../../components/dashboard/useDashboardViz';
import WidgetNoHostEntity from '../../../../components/dashboard/WidgetNoHostEntity';
import type { WidgetColumn, WidgetDataSelection, WidgetHost, WidgetParameters } from '../../../../utils/widget/widget';
import { DraftsListQuery$data } from './__generated__/DraftsListQuery.graphql';

const defaultDraftColumns: WidgetColumn[] = [
  { attribute: 'name', label: 'Name' },
  { attribute: 'draft_status', label: 'Status' },
  { attribute: 'workflowInstance', label: 'Workflow status' },
  { attribute: 'creators', label: 'Creators' },
  { attribute: 'objectAssignee' },
  { attribute: 'objectParticipant' },
  { attribute: 'created_at', label: 'Creation date' },
];

export const draftsListQuery = graphql`
  query DraftsListQuery(
    $first: Int
    $orderBy: DraftWorkspacesOrdering
    $orderMode: OrderingMode
    $filters: FilterGroup
  ) {
    draftWorkspaces(
      first: $first
      orderBy: $orderBy
      orderMode: $orderMode
      filters: $filters
    ) {
      edges {
        node {
          id
          entity_type
          name
          draft_status
          created_at
          creators {
            id
            name
          }
          objectAssignee {
            entity_type
            id
            name
          }
          objectParticipant {
            entity_type
            id
            name
          }
          workflowInstance {
            currentStatus {
              id
              template {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

const DraftsList = ({
  title,
  variant,
  height,
  startDate,
  endDate,
  dataSelection,
  widgetId,
  parameters = {},
  popover,
  host,
}: {
  title?: string;
  variant?: string;
  height?: CSSProperties['height'];
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  dataSelection: WidgetDataSelection[];
  widgetId: string;
  parameters?: WidgetParameters;
  popover?: ReactNode;
  host?: WidgetHost;
}) => {
  const { t_i18n } = useFormatter();
  const { resolvedDataSelection, isMissingHostEntity, isPreviewMode } = useDashboardViz({
    perspective: 'entities',
    dataSelection,
    host,
  });
  const selection = resolvedDataSelection[0];
  const columns: WidgetColumn[] = selection.columns ? [...selection.columns] : defaultDraftColumns;

  const sortBy = selection.sort_by && selection.sort_by.length > 0
    ? selection.sort_by
    : 'created_at';
  const dateAttribute = selection.date_attribute && selection.date_attribute.length > 0
    ? selection.date_attribute
    : 'created_at';
  const { filters } = buildFiltersAndOptionsForWidgets(selection.filters, { startDate, endDate, dateAttribute });

  const rootRef = useRef(null);

  return (
    <WidgetContainer
      padding="horizontal"
      height={height}
      title={parameters.title ?? title ?? t_i18n('Draft workspaces list')}
      variant={variant}
      action={popover}
      showPreviewTag={isPreviewMode}
    >
      <div ref={rootRef} style={{ height: '100%' }}>
        {isMissingHostEntity
          ? <WidgetNoHostEntity host={host} />
          : (
              <QueryRenderer
                query={draftsListQuery}
                variables={{
                  first: selection.number ?? 10,
                  orderBy: sortBy,
                  orderMode: selection.sort_mode ?? 'desc',
                  filters,
                }}
                render={({ props }: { props: DraftsListQuery$data }) => {
                  if (props && props.draftWorkspaces && props.draftWorkspaces.edges.length > 0) {
                    return (
                      <WidgetListCoreObjects
                        data={[...props.draftWorkspaces.edges]}
                        rootRef={rootRef.current ?? undefined}
                        widgetId={widgetId}
                        pageSize={selection.number ?? 10}
                        columns={columns}
                      />
                    );
                  }
                  if (props) {
                    return <WidgetNoData />;
                  }
                  return <Loader variant={LoaderVariant.inElement} />;
                }}
              />
            )}
      </div>
    </WidgetContainer>
  );
};

export default DraftsList;
