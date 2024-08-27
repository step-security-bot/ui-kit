import {BaseFacetSearchResult} from '../../../../../api/search/facet-search/base/base-facet-search-response';
import {CategoryFacetSearchResult} from '../../../../../api/search/facet-search/category-facet-search/category-facet-search-response';
import {CommerceEngine} from '../../../../../app/commerce-engine/commerce-engine';
import {ensureAtLeastOneSolutionType} from '../../../../../app/commerce-ssr-engine/common';
import {
  ControllerDefinitionOption,
  SolutionType,
  SubControllerDefinitionWithoutProps,
} from '../../../../../app/commerce-ssr-engine/types/common';
import {stateKey} from '../../../../../app/state-key';
import {facetRequestSelector} from '../../../../../features/commerce/facets/facet-set/facet-set-selector';
import {
  AnyFacetResponse,
  RegularFacetValue,
} from '../../../../../features/commerce/facets/facet-set/interfaces/response';
import {manualNumericFacetSelector} from '../../../../../features/commerce/facets/numeric-facet/manual-numeric-facet-selectors';
import {manualNumericFacetReducer as manualNumericFacetSet} from '../../../../../features/commerce/facets/numeric-facet/manual-numeric-facet-slice';
import {categoryFacetSearchStateSelector} from '../../../../../features/facets/facet-search-set/category/category-facet-search-state-selector';
import {specificFacetSearchStateSelector} from '../../../../../features/facets/facet-search-set/specific/specific-facet-search-state-selector';
import {ManualRangeSection} from '../../../../../state/state-sections';
import {loadReducerError} from '../../../../../utils/errors';
import {
  isFacetLoadingResponseSelector as listingIsFacetLoadingResponseSelector,
  facetResponseSelector as listingFacetResponseSelector,
} from '../../../product-listing/facets/headless-product-listing-facet-options';
import {buildProductListing} from '../../../product-listing/headless-product-listing';
import {
  isFacetLoadingResponseSelector as searchIsFacetLoadingResponseSelector,
  facetResponseSelector as searchFacetResponseSelector,
} from '../../../search/facets/headless-search-facet-options';
import {buildSearch} from '../../../search/headless-search';
import {
  CategoryFacet,
  CategoryFacetState,
  getCategoryFacetState,
} from '../category/headless-commerce-category-facet';
import {
  DateFacet,
  DateFacetState,
  getDateFacetState,
} from '../date/headless-commerce-date-facet';
import {
  CategoryFacetValue,
  FacetType,
  getCoreFacetState,
} from '../headless-core-commerce-facet';
import {
  getNumericFacetState,
  NumericFacet,
  NumericFacetState,
} from '../numeric/headless-commerce-numeric-facet';
import {
  getRegularFacetState,
  RegularFacet,
  RegularFacetState,
} from '../regular/headless-commerce-regular-facet';
import {
  FacetGenerator as CSRFacetGenerator,
  MappedGeneratedFacetController,
} from './headless-commerce-facet-generator';

export type {
  BaseFacetSearchResult,
  CategoryFacet,
  CategoryFacetState,
  CategoryFacetValue,
  CategoryFacetSearchResult,
  DateFacet,
  DateFacetState,
  NumericFacet,
  NumericFacetState,
  RegularFacet,
  RegularFacetState,
  RegularFacetValue,
};

export type FacetGeneratorState = MappedFacetStates;

type MappedFacetStates = Array<MappedFacetState[FacetType]>;

type MappedFacetState = {
  [T in FacetType]: T extends 'numericalRange'
    ? NumericFacetState
    : T extends 'regular'
      ? RegularFacetState
      : T extends 'dateRange'
        ? DateFacetState
        : T extends 'hierarchical'
          ? CategoryFacetState
          : never;
};

export function defineFacetGenerator<
  TOptions extends ControllerDefinitionOption | undefined,
>(options?: TOptions) {
  ensureAtLeastOneSolutionType(options);
  return {
    ...options,
    build: (engine, solutionType) =>
      buildFacetGenerator(engine, {props: {solutionType: solutionType!}}),
  } as SubControllerDefinitionWithoutProps<FacetGenerator, TOptions>;
}

/**
 * The `FacetGenerator` headless sub-controller creates commerce facet sub-controllers from the Commerce API search or
 * product listing response.
 *
 * Commerce facets are not requested by the implementer, but rather pre-configured through the Coveo Merchandising Hub
 * (CMH). The implementer is only responsible for leveraging the facet controllers created by this sub-controller to
 * properly render facets in their application.
 */
export interface FacetGenerator
  extends Omit<CSRFacetGenerator, 'state' | 'facets'> {
  /**
   * The state of each every facet returned by the Commerce API.
   *
   * In a server-side rendering (SSR) scenario, you must use this state to render the facet UI components before the
   * facet controller is hydrated on the client side.
   *
   * Once the facet generator controller has been hydrated, you must use the `getFacetController` method to retrieve
   * the individual facet controllers and subscribe to their respective states.
   */
  state: FacetGeneratorState;

  /**
   * Builds a facet controller for the specified facet ID.
   *
   * @param facetId The unique identifier of the facet.
   * @param facetType The type of facet to build.
   * @returns A facet controller of the specified type, or `undefined` if the facet does not exist in the state.
   */
  getFacetController: <T extends FacetType>(
    facetId: string,
    facetType: T
  ) => MappedGeneratedFacetController[T] | undefined;
}

export interface FacetGeneratorOptions {
  props: FacetGeneratorProps;
}

export interface FacetGeneratorProps {
  solutionType: SolutionType;
}

/**
 * @internal
 *
 * Creates a `FacetGenerator` sub-controller for server-side rendering purposes (SSR).
 *
 * @param engine - The SSR commerce engine.
 * @param options - The facet generator options used internally.
 * @returns A `FacetGenerator` sub-controller.
 */
export function buildFacetGenerator(
  engine: CommerceEngine,
  options: FacetGeneratorOptions
): FacetGenerator {
  if (!loadFacetGeneratorReducers(engine)) {
    throw loadReducerError;
  }

  const getEngineState = () => engine[stateKey];
  const solutionType = options.props.solutionType;

  const getFacetResponseSelector = (facetId: string) => {
    return solutionType === SolutionType.listing
      ? listingFacetResponseSelector(getEngineState(), facetId)
      : searchFacetResponseSelector(getEngineState(), facetId);
  };

  const isFacetLoadingResponseSelector =
    solutionType === SolutionType.listing
      ? listingIsFacetLoadingResponseSelector(getEngineState())
      : searchIsFacetLoadingResponseSelector(getEngineState());

  const createFacetState = (facetResponseSelector: AnyFacetResponse) => {
    const facetId = facetResponseSelector.facetId;
    return getCoreFacetState(
      facetRequestSelector(getEngineState(), facetId),
      facetResponseSelector,
      isFacetLoadingResponseSelector
    );
  };

  const baseController =
    solutionType === SolutionType.listing
      ? buildProductListing(engine).facetGenerator()
      : buildSearch(engine).facetGenerator();

  const {state, ...restOfBaseController} = baseController;

  return {
    ...restOfBaseController,

    getFacetController: <T extends FacetType>(
      facetId: string,
      facetType: T
    ) => {
      const controller = baseController.facets.find(
        (f) => f.state.facetId === facetId && f.type === facetType
      );

      return controller as MappedGeneratedFacetController[T] | undefined;
    },

    get state() {
      const facetResponseSelectors = baseController.state
        .map(getFacetResponseSelector)
        .filter((selector) => selector !== undefined);

      return facetResponseSelectors.map((selector) => {
        const facetResponseSelector = selector!;
        const facetId = facetResponseSelector.facetId;
        switch (facetResponseSelector.type) {
          case 'hierarchical':
            return getCategoryFacetState(
              createFacetState(facetResponseSelector) as CategoryFacetState,
              categoryFacetSearchStateSelector(getEngineState(), facetId)
            );
          case 'dateRange':
            return getDateFacetState(
              createFacetState(facetResponseSelector) as DateFacetState
            );

          case 'numericalRange':
            return getNumericFacetState(
              createFacetState(facetResponseSelector) as NumericFacetState,
              facetResponseSelector,
              manualNumericFacetSelector(getEngineState(), facetId)
            );
          case 'regular':
            return getRegularFacetState(
              createFacetState(facetResponseSelector) as RegularFacetState,
              specificFacetSearchStateSelector(getEngineState(), facetId)
            );
        }
      });
    },
  };
}

function loadFacetGeneratorReducers(
  engine: CommerceEngine
): engine is CommerceEngine<ManualRangeSection> {
  engine.addReducers({manualNumericFacetSet});
  return true;
}