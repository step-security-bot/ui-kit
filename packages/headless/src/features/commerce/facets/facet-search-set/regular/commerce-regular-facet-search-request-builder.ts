import {CommerceFacetSearchRequest} from '../../../../../api/commerce/facet-search/facet-search-request';
import {NavigatorContext} from '../../../../../app/navigatorContextProvider';
import {buildCommerceAPIRequest} from '../../../common/actions';
import {getFacetIdWithoutCommerceFieldSuggestionNamespace} from '../commerce-facet-search-actions';
import {StateNeededForRegularFacetSearch} from './commerce-regular-facet-search-state';

export const buildFacetSearchRequest = (
  facetId: string,
  state: StateNeededForRegularFacetSearch,
  isFieldSuggestionsRequest: boolean,
  navigatorContext: NavigatorContext
): CommerceFacetSearchRequest => {
  const baseFacetQuery = state.facetSearchSet[facetId]!.options.query;
  const facetQuery = `*${baseFacetQuery}*`;
  const query = state.commerceQuery?.query;

  const {
    url,
    accessToken,
    organizationId,
    trackingId,
    language,
    country,
    currency,
    clientId,
    context,
    ...restOfCommerceAPIRequest
  } = buildCommerceAPIRequest(state, navigatorContext);

  return {
    url,
    accessToken,
    organizationId,
    facetId: getFacetIdWithoutCommerceFieldSuggestionNamespace(facetId),
    facetQuery,
    trackingId,
    language,
    country,
    currency,
    clientId,
    context,
    query,
    ...(!isFieldSuggestionsRequest && {...restOfCommerceAPIRequest, query: ''}),
  };
};
