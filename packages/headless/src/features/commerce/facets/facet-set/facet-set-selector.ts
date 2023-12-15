import {
  CommerceFacetSetSection,
  CommerceSearchSection,
  ProductListingV2Section,
} from '../../../../state/state-sections';
import {AnyFacetResponse} from './interfaces/response';

function isFacetResponse(
  state: CommerceFacetSetSection,
  response: AnyFacetResponse | undefined
): response is AnyFacetResponse {
  return !!response && response.facetId in state.commerceFacetSet;
}

function baseCommerceFacetResponseSelector(
  state: ProductListingV2Section | CommerceSearchSection,
  facetId: string
) {
  const findById = (response: {facetId: string}) =>
    response.facetId === facetId;

  if ('productListing' in state) {
    return state.productListing.facets.find(findById);
  }

  if ('commerceSearch' in state) {
    return state.commerceSearch.facets.find(findById);
  }

  return undefined;
}

export const commerceFacetResponseSelector = (
  state: (ProductListingV2Section | CommerceSearchSection) &
    CommerceFacetSetSection,
  facetId: string
) => {
  const response = baseCommerceFacetResponseSelector(state, facetId);
  if (isFacetResponse(state, response)) {
    return response;
  }

  return undefined;
};

export const isCommerceFacetLoadingResponseSelector = (
  state: ProductListingV2Section | CommerceSearchSection
) => {
  if ('productListing' in state) {
    return state.productListing.isLoading;
  }

  if ('commerceSearch' in state) {
    return state.commerceSearch.isLoading;
  }

  return undefined;
};
