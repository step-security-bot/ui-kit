import {CoreEngine} from '../../../../../app/engine';
import {
  configuration,
  numericFacetSet,
  facetOptions,
  search,
} from '../../../../../app/reducers';
import {deselectAllFacetValues} from '../../../../../features/facets/facet-set/facet-set-actions';
import {RangeFacetSortCriterion} from '../../../../../features/facets/range-facets/generic/interfaces/request';
import {
  NumericFacetRequest,
  NumericRangeRequest,
} from '../../../../../features/facets/range-facets/numeric-facet-set/interfaces/request';
import {
  NumericFacetResponse,
  NumericFacetValue,
} from '../../../../../features/facets/range-facets/numeric-facet-set/interfaces/response';
import {
  RegisterNumericFacetActionCreatorPayload,
  registerNumericFacet,
} from '../../../../../features/facets/range-facets/numeric-facet-set/numeric-facet-actions';
import {executeToggleNumericFacetSelect} from '../../../../../features/facets/range-facets/numeric-facet-set/numeric-facet-controller-actions';
import {
  ConfigurationSection,
  FacetOptionsSection,
  NumericFacetSection,
  SearchSection,
} from '../../../../../state/state-sections';
import {loadReducerError} from '../../../../../utils/errors';
import {Controller} from '../../../../controller/headless-controller';
import {determineFacetId} from '../../_common/facet-id-determinor';
import {
  assertRangeFacetOptions,
  buildCoreRangeFacet,
} from '../headless-core-range-facet';
import {
  NumericFacetOptions,
  validateNumericFacetOptions,
} from './headless-numeric-facet-options';
import {buildNumericRange, NumericRangeOptions} from './numeric-range';

export type {
  NumericRangeOptions,
  NumericRangeRequest,
  NumericFacetValue,
  NumericFacetOptions,
};
export {buildNumericRange};

export interface NumericFacetProps {
  /**
   * The options for the `NumericFacet` controller.
   */
  options: NumericFacetOptions;
}

/**
 * The `NumericFacet` controller makes it possible to create a facet with numeric ranges.
 */
export interface NumericFacet extends Controller {
  /**
   * Deselects all facet values.
   */
  deselectAll(): void;

  /**
   * Checks whether the facet values are sorted according to the specified criterion.
   *
   * @param criterion - The criterion to compare.
   * @returns Whether the facet values are sorted according to the specified criterion.
   */
  isSortedBy(criterion: RangeFacetSortCriterion): boolean;

  /**
   * Checks whether the specified facet value is selected.
   *
   * @param selection - The facet value to check.
   * @returns Whether the specified facet value is selected.
   */
  isValueSelected(selection: NumericFacetValue): boolean;

  /** Sorts the facet values according to the specified criterion.
   *
   * @param criterion - The criterion to sort values by.
   */
  sortBy(criterion: RangeFacetSortCriterion): void;

  /**
   * Toggles the specified facet value.
   *
   * @param selection - The facet value to toggle.
   */
  toggleSelect(selection: NumericFacetValue): void;

  /**
   * Toggles the specified facet value, deselecting others.
   *
   * @param selection - The facet value to toggle.
   */
  toggleSingleSelect(selection: NumericFacetValue): void;

  /**
   * Enables the facet. I.e., undoes the effects of `disable`.
   */
  enable(): void;

  /**
   * Disables the facet. I.e., prevents it from filtering results.
   */
  disable(): void;

  /**
   * The state of the `NumericFacet` controller.
   */
  state: NumericFacetState;
}

/**
 * A scoped and simplified part of the headless state that is relevant to the `NumericFacet` controller.
 */
export interface NumericFacetState {
  /**
   * The facet ID.
   * */
  facetId: string;

  /**
   * The values of the facet.
   */
  values: NumericFacetValue[];

  /**
   * The active sortCriterion of the facet.
   */
  sortCriterion: RangeFacetSortCriterion;

  /**
   * `true` if a search is in progress and `false` otherwise.
   */
  isLoading: boolean;

  /**
   * `true` if there is at least one non-idle value and `false` otherwise.
   */
  hasActiveValues: boolean;

  /**
   * Whether the facet is enabled and its values are used to filter search results.
   */
  enabled: boolean;
}

/**
 * Creates a `NumericFacet` controller instance.
 *
 * @param engine - The headless engine.
 * @param props - The configurable `NumericFacet` properties.
 * @returns A `NumericFacet` controller instance.
 */
export function buildCoreNumericFacet(
  engine: CoreEngine,
  props: NumericFacetProps
): NumericFacet {
  if (!loadNumericFacetReducers(engine)) {
    throw loadReducerError;
  }

  assertRangeFacetOptions(props.options, 'buildNumericFacet');

  const dispatch = engine.dispatch;

  const facetId = determineFacetId(engine, props.options);
  const options: RegisterNumericFacetActionCreatorPayload = {
    currentValues: [],
    ...props.options,
    facetId,
  };

  validateNumericFacetOptions(engine, options);

  dispatch(registerNumericFacet(options));

  const rangeFacet = buildCoreRangeFacet<
    NumericFacetRequest,
    NumericFacetResponse
  >(engine, {
    facetId,
    getRequest: () => engine.state.numericFacetSet[facetId]!.request,
  });

  return {
    ...rangeFacet,
    toggleSelect: (selection: NumericFacetValue) =>
      dispatch(executeToggleNumericFacetSelect({facetId, selection})),

    toggleSingleSelect(selection: NumericFacetValue) {
      if (selection.state === 'idle') {
        dispatch(deselectAllFacetValues(facetId));
      }

      this.toggleSelect(selection);
    },

    get state() {
      return rangeFacet.state;
    },
  };
}

function loadNumericFacetReducers(
  engine: CoreEngine
): engine is CoreEngine<
  NumericFacetSection &
    FacetOptionsSection &
    ConfigurationSection &
    SearchSection
> {
  engine.addReducers({numericFacetSet, facetOptions, configuration, search});
  return true;
}
