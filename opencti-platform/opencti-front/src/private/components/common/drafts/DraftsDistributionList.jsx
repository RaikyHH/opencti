import React from 'react';
import { graphql } from 'react-relay';
import { QueryRenderer } from '../../../../relay/environment';
import { useFormatter } from '../../../../components/i18n';
import useGranted, { SETTINGS_SETACCESSES } from '../../../../utils/hooks/useGranted';
import WidgetContainer from '../../../../components/dashboard/WidgetContainer';
import WidgetNoData from '../../../../components/dashboard/WidgetNoData';
import WidgetDistributionList from '../../../../components/dashboard/WidgetDistributionList';
import { getMainRepresentative, isFieldForIdentifier } from '../../../../utils/defaultRepresentatives';
import Loader, { LoaderVariant } from '../../../../components/Loader';
import useDashboardViz from '../../../../components/dashboard/useDashboardViz';
import WidgetNoHostEntity from '../../../../components/dashboard/WidgetNoHostEntity';

const draftsDistributionListQuery = graphql`
  query DraftsDistributionListQuery(
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

const DraftsDistributionList = ({
  variant,
  height,
  startDate,
  endDate,
  dataSelection,
  parameters = {},
  popover,
  host,
}) => {
  const { t_i18n } = useFormatter();
  const hasSetAccess = useGranted([SETTINGS_SETACCESSES]);
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
        query={draftsDistributionListQuery}
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
        render={({ props }) => {
          if (props && props.draftWorkspacesDistribution && props.draftWorkspacesDistribution.length > 0) {
            const data = props.draftWorkspacesDistribution.map((n) => {
              let { label } = n;
              if (isFieldForIdentifier(selection.attribute)) {
                label = getMainRepresentative(n.entity) || n.label;
              } else if (selection.attribute === 'entity_type' && t_i18n(`entity_${n.label}`) !== `entity_${n.label}`) {
                label = t_i18n(`entity_${n.label}`);
              }
              return {
                label,
                value: n.value,
                id: isFieldForIdentifier(selection.attribute) ? n.entity?.id : null,
                type: n.entity?.entity_type ?? n.label,
              };
            });
            return <WidgetDistributionList data={data} hasSettingAccess={hasSetAccess} />;
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
      height={height}
      title={parameters.title ?? t_i18n('Distribution of draft workspaces')}
      variant={variant}
      action={popover}
      showPreviewTag={isPreviewMode}
    >
      {renderContent()}
    </WidgetContainer>
  );
};

export default DraftsDistributionList;
