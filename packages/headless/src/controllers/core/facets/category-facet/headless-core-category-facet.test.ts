import {configuration} from '../../../../app/common-reducers';
import {updateFacetOptions} from '../../../../features/facet-options/facet-options-actions';
import {facetOptionsReducer as facetOptions} from '../../../../features/facet-options/facet-options-slice';
import {
  deselectAllCategoryFacetValues,
  registerCategoryFacet,
  toggleSelectCategoryFacetValue,
  updateCategoryFacetNumberOfValues,
  updateCategoryFacetSortCriterion,
} from '../../../../features/facets/category-facet-set/category-facet-set-actions';
import {categoryFacetSetReducer as categoryFacetSet} from '../../../../features/facets/category-facet-set/category-facet-set-slice';
import {defaultCategoryFacetOptions} from '../../../../features/facets/category-facet-set/category-facet-set-slice';
import {
  findActiveValueAncestry,
  partitionIntoParentsAndValues,
} from '../../../../features/facets/category-facet-set/category-facet-utils';
import {
  CategoryFacetRequest,
  CategoryFacetSortCriterion,
} from '../../../../features/facets/category-facet-set/interfaces/request';
import {categoryFacetSearchSetReducer as categoryFacetSearchSet} from '../../../../features/facets/facet-search-set/category/category-facet-search-set-slice';
import {searchReducer as search} from '../../../../features/search/search-slice';
import {SearchAppState} from '../../../../state/search-app-state';
import {buildMockCategoryFacetRequest} from '../../../../test/mock-category-facet-request';
import {buildMockCategoryFacetResponse} from '../../../../test/mock-category-facet-response';
import {buildMockCategoryFacetSearch} from '../../../../test/mock-category-facet-search';
import {buildMockCategoryFacetSlice} from '../../../../test/mock-category-facet-slice';
import {buildMockCategoryFacetValue} from '../../../../test/mock-category-facet-value';
import {
  buildMockSearchEngine,
  MockedSearchEngine,
} from '../../../../test/mock-engine-v2';
import {createMockState} from '../../../../test/mock-state';
import * as FacetIdDeterminor from '../_common/facet-id-determinor';
import {
  buildCoreCategoryFacet,
  CategoryFacetOptions,
  CategoryFacetValue,
  CoreCategoryFacet,
} from './headless-core-category-facet';

jest.mock(
  '../../../../features/facets/category-facet-set/category-facet-utils'
);

jest.mock(
  '../../../../features/facets/category-facet-set/category-facet-set-actions'
);

jest.mock('../../../../features/facet-options/facet-options-actions');

const {
  findActiveValueAncestry: actualFindActiveValueAncestry,
  partitionIntoParentsAndValues: actualPartitionIntoParentsAndValues,
} = jest.requireActual(
  '../../../../features/facets/category-facet-set/category-facet-utils'
);

describe('category facet', () => {
  const facetId = '1';
  let options: CategoryFacetOptions;
  let state: SearchAppState;
  let engine: MockedSearchEngine;
  let categoryFacet: CoreCategoryFacet;
  const findActiveValueAncestryMock = jest.mocked(findActiveValueAncestry);
  const partitionIntoParentsAndValuesMock = jest.mocked(
    partitionIntoParentsAndValues
  );

  function initCategoryFacet() {
    engine = buildMockSearchEngine(state);
    categoryFacet = buildCoreCategoryFacet(engine, {options});
  }

  function setFacetRequest(config: Partial<CategoryFacetRequest> = {}) {
    const request = buildMockCategoryFacetRequest({facetId, ...config});
    state.categoryFacetSet[facetId] = buildMockCategoryFacetSlice({request});
    state.categoryFacetSearchSet[facetId] = buildMockCategoryFacetSearch();
  }

  beforeEach(() => {
    options = {
      facetId,
      field: 'geography',
    };
    findActiveValueAncestryMock.mockImplementation(
      actualFindActiveValueAncestry
    );
    partitionIntoParentsAndValuesMock.mockImplementation(
      actualPartitionIntoParentsAndValues
    );
    state = createMockState();
    setFacetRequest();
    initCategoryFacet();
  });

  it('it adds the correct reducers to engine', () => {
    expect(engine.addReducers).toHaveBeenCalledWith({
      configuration,
      categoryFacetSet,
      categoryFacetSearchSet,
      facetOptions,
      search,
    });
  });

  it('it calls #determineFacetId with the correct params', () => {
    jest.spyOn(FacetIdDeterminor, 'determineFacetId');

    initCategoryFacet();

    expect(FacetIdDeterminor.determineFacetId).toHaveBeenCalledWith(
      engine,
      options
    );
  });

  it('#state.facetId exposes the facet id', () => {
    expect(categoryFacet.state.facetId).toBe(facetId);
  });

  it('registers a category facet with the passed options and default optional parameters', () => {
    expect(registerCategoryFacet).toHaveBeenCalledWith(
      expect.objectContaining({
        ...defaultCategoryFacetOptions,
        ...options,
        facetId,
      })
    );
  });

  it('when an option is invalid, it throws', () => {
    options.numberOfValues = 0;
    expect(() => initCategoryFacet()).toThrow(
      'Check the options of buildCategoryFacet'
    );
  });

  it('is subscribable', () => {
    expect(categoryFacet.subscribe).toBeDefined();
  });

  it('#state.activeValue is the return value of #findActiveValueAncestry', () => {
    const referencedReturnValue = buildMockCategoryFacetValue();
    findActiveValueAncestryMock.mockReturnValueOnce([referencedReturnValue]);

    initCategoryFacet();

    expect(findActiveValueAncestry).toBeCalledTimes(1);
    expect(categoryFacet.state.activeValue).toBe(referencedReturnValue);
  });

  describe('when the search response is empty', () => {
    it('#state.values is an empty array', () => {
      expect(state.search.response.facets).toEqual([]);
      expect(categoryFacet.state.values).toEqual([]);
    });

    it('#state.parents is an empty array', () => {
      expect(categoryFacet.state.parents).toEqual([]);
    });

    it('#state.valuesAsTrees', () => {
      expect(categoryFacet.state.valuesAsTrees).toEqual([]);
    });
  });

  describe('when the search response has a category facet with a single level of values', () => {
    const values = [buildMockCategoryFacetValue()];

    beforeEach(() => {
      const response = buildMockCategoryFacetResponse({facetId, values});
      state.search.response.facets = [response];
    });

    it('#state.values contains the same values', () => {
      expect(categoryFacet.state.values).toBe(values);
    });

    it('#state.valuesAsTrees contains the same values', () => {
      expect(categoryFacet.state.valuesAsTrees).toBe(values);
    });
  });

  it('#state.valuesAsTrees is the untouched response', () => {
    const values: CategoryFacetValue[] = [];
    const response = buildMockCategoryFacetResponse({facetId, values});
    state.search.response.facets = [response];
    expect(categoryFacet.state.valuesAsTrees).toBe(values);
  });

  describe('when the search response has a category facet with nested values', () => {
    const innerValues = [
      buildMockCategoryFacetValue({value: 'C'}),
      buildMockCategoryFacetValue({value: 'D'}),
    ];
    const middleValue = buildMockCategoryFacetValue({
      value: 'B',
      children: innerValues,
    });
    const outerValue = buildMockCategoryFacetValue({
      value: 'A',
      children: [middleValue],
    });

    beforeEach(() => {
      const response = buildMockCategoryFacetResponse({
        facetId,
        values: [outerValue],
      });
      state.search.response.facets = [response];
    });

    it('#state.parents contains the outer and middle values', () => {
      expect(categoryFacet.state.parents).toEqual([outerValue, middleValue]);
    });

    it('#state.values contains the innermost values', () => {
      expect(categoryFacet.state.values).toBe(innerValues);
    });

    it('#state.parents contains the outer and middle values', () => {
      expect(categoryFacet.state.parents).toEqual([outerValue, middleValue]);
    });

    it('#state.valueAsTree contains the outer value', () => {
      expect(categoryFacet.state.valuesAsTrees).toEqual([outerValue]);
    });

    it('#state.isHierarchical should be true', () => {
      expect(categoryFacet.state.isHierarchical).toBe(true);
    });
  });

  describe('when the search response has a category facet with nested values and multiple root values', () => {
    const innerValues = [
      buildMockCategoryFacetValue({value: 'C'}),
      buildMockCategoryFacetValue({value: 'D'}),
    ];
    const middleValue = buildMockCategoryFacetValue({
      value: 'B',
      children: innerValues,
    });
    const outerValue = buildMockCategoryFacetValue({
      value: 'A',
      children: [middleValue],
    });
    const neighboringValue = buildMockCategoryFacetValue({value: 'D'});

    beforeEach(() => {
      const response = buildMockCategoryFacetResponse({
        facetId,
        values: [outerValue, neighboringValue],
      });
      state.search.response.facets = [response];
    });

    it('#state.valuesAsTrees contains both root values (outer & neighboring)', () => {
      expect(categoryFacet.state.valuesAsTrees).toEqual([
        outerValue,
        neighboringValue,
      ]);
    });

    it('#state.isHierarchical should be true', () => {
      expect(categoryFacet.state.isHierarchical).toBe(true);
    });
  });

  describe('when the category facet has a selected leaf value with no children', () => {
    const selectedValue = buildMockCategoryFacetValue({
      value: 'A',
      state: 'selected',
      children: [],
    });

    beforeEach(() => {
      const response = buildMockCategoryFacetResponse({
        facetId,
        values: [selectedValue],
      });
      state.search.response.facets = [response];
    });

    it('#state.parents contains the selected leaf value', () => {
      expect(categoryFacet.state.parents).toEqual([selectedValue]);
    });

    it('#state.selectedValueAncestry contains the selected leaf value', () => {
      expect(categoryFacet.state.selectedValueAncestry).toEqual([
        selectedValue,
      ]);
    });

    it('#state.values is an empty array', () => {
      expect(categoryFacet.state.values).toEqual([]);
    });

    it('#state.activeValue is the selected leaf value', () => {
      expect(categoryFacet.state.activeValue).toEqual(selectedValue);
    });

    it('#state.hasActiveValues is true', () => {
      expect(categoryFacet.state.hasActiveValues).toBe(true);
    });
  });

  describe('#toggleSelect', () => {
    it('dispatches #toggleCategoryFacetValue with the passed selection', () => {
      const selection = buildMockCategoryFacetValue({value: 'A'});
      categoryFacet.toggleSelect(selection);

      expect(toggleSelectCategoryFacetValue).toHaveBeenCalledWith(
        expect.objectContaining({
          facetId,
          selection,
          retrieveCount: defaultCategoryFacetOptions.numberOfValues,
        })
      );
    });

    it('if the numberOfValues is set it dispatches #toggleCategoryFacetValue with the correct retrieveCount', () => {
      options.numberOfValues = 10;
      initCategoryFacet();
      const selection = buildMockCategoryFacetValue({value: 'A'});
      categoryFacet.toggleSelect(selection);

      expect(toggleSelectCategoryFacetValue).toHaveBeenCalledWith(
        expect.objectContaining({
          facetId,
          selection,
          retrieveCount: 10,
        })
      );
    });

    it('dispatches #updateFacetOptions', () => {
      const selection = buildMockCategoryFacetValue({value: 'A'});
      categoryFacet.toggleSelect(selection);

      expect(updateFacetOptions).toHaveBeenCalled();
    });
  });

  describe('#deselectAll', () => {
    beforeEach(() => categoryFacet.deselectAll());

    it('dispatches #deselectAllCategoryFacetValues', () => {
      expect(deselectAllCategoryFacetValues).toHaveBeenCalledWith(facetId);
    });

    it('dispatches #updateFacetOptions', () => {
      expect(updateFacetOptions).toHaveBeenCalled();
    });
  });

  describe('#state.hasActiveValues', () => {
    it('when there is a selected value, it is true', () => {
      const values = [buildMockCategoryFacetValue({state: 'selected'})];
      const response = buildMockCategoryFacetResponse({facetId, values});
      state.search.response.facets = [response];

      expect(categoryFacet.state.hasActiveValues).toBe(true);
    });

    it('when nothing is selected, it is false', () => {
      const response = buildMockCategoryFacetResponse({facetId});
      state.search.response.facets = [response];

      expect(categoryFacet.state.hasActiveValues).toBe(false);
    });
  });

  describe('#state.hasMoreValues', () => {
    describe('when currentValues is Empty (nothing is selected)', () => {
      it('if #moreValuesAvailable is true #state.canShowMoreValues is true', () => {
        const response = buildMockCategoryFacetResponse({
          facetId,
          moreValuesAvailable: true,
        });
        state.search.response.facets = [response];

        expect(categoryFacet.state.canShowMoreValues).toBe(true);
      });

      it('if #moreValuesAvailable is false #state.canShowMoreValues is false', () => {
        const response = buildMockCategoryFacetResponse({
          facetId,
          moreValuesAvailable: false,
        });
        state.search.response.facets = [response];

        expect(categoryFacet.state.canShowMoreValues).toBe(false);
      });
    });

    describe('when a value in currentValue is selected (top level value selected)', () => {
      it('if #moreValuesAvailable is true, #state.canShowMore is true', () => {
        const values = [
          buildMockCategoryFacetValue({
            numberOfResults: 10,
            state: 'selected',
            moreValuesAvailable: true,
          }),
        ];
        const response = buildMockCategoryFacetResponse({
          facetId,
          values,
          moreValuesAvailable: false,
        });

        state.search.response.facets = [response];
        expect(categoryFacet.state.canShowMoreValues).toBe(true);
      });

      it('if #moreValuesAvailable is false, #state.canShowMore is false', () => {
        const values = [
          buildMockCategoryFacetValue({
            numberOfResults: 10,
            state: 'selected',
            moreValuesAvailable: false,
          }),
        ];
        const response = buildMockCategoryFacetResponse({
          facetId,
          values,
          moreValuesAvailable: true,
        });

        state.search.response.facets = [response];
        expect(categoryFacet.state.canShowMoreValues).toBe(false);
      });
    });

    describe('when a nested value (currentValues[n].children[n]) is selected', () => {
      it('if currentValues has a value with more than 1 child', () => {
        const nestedChild = buildMockCategoryFacetValue({
          numberOfResults: 10,
          state: 'selected',
          moreValuesAvailable: true,
        });
        const values = [
          buildMockCategoryFacetValue({
            numberOfResults: 10,
            moreValuesAvailable: false,
            children: [nestedChild],
          }),
        ];
        const response = buildMockCategoryFacetResponse({facetId, values});

        state.search.response.facets = [response];
        expect(categoryFacet.state.canShowMoreValues).toBe(true);
      });
    });
  });

  describe('#state.canShowLessValues', () => {
    it('is false when there are 0 values being displayed', () => {
      expect(categoryFacet.state.canShowLessValues).toBe(false);
    });

    it('is true when there are more than the initial numberOfValues being shown', () => {
      options.numberOfValues = 1;
      initCategoryFacet();

      const value = buildMockCategoryFacetValue();
      const values = [value, value];
      const response = buildMockCategoryFacetResponse({facetId, values});
      state.search.response.facets = [response];

      expect(categoryFacet.state.canShowLessValues).toBe(true);
    });
  });

  describe('#showMoreValues', () => {
    it('with no values, it dispatches #updateCategoryFacetNumberOfResults with the correct number of values', () => {
      categoryFacet.showMoreValues();
      expect(updateCategoryFacetNumberOfValues).toHaveBeenCalledWith({
        facetId,
        numberOfValues: defaultCategoryFacetOptions.numberOfValues,
      });
    });

    it('with a value, it dispatches #updateCategoryFacetNumberOfResults with the correct number of values', () => {
      const values = [buildMockCategoryFacetValue()];
      const response = buildMockCategoryFacetResponse({facetId, values});
      state.search.response.facets = [response];

      initCategoryFacet();

      categoryFacet.showMoreValues();
      expect(updateCategoryFacetNumberOfValues).toHaveBeenCalledWith({
        facetId,
        numberOfValues: 6,
      });
    });

    it('dispatches #updateFacetOptions with #freezeFacetOrder true', () => {
      categoryFacet.showMoreValues();
      expect(updateFacetOptions).toHaveBeenCalled();
    });
  });

  describe('#showLessValues', () => {
    beforeEach(() => categoryFacet.showLessValues());

    it('dispatches #updateCategoryFacetNumberOfResults with the correct numberOfValues', () => {
      expect(updateCategoryFacetNumberOfValues).toHaveBeenCalledWith({
        facetId,
        numberOfValues: 5,
      });
    });

    it('dispatches #updateFacetOptions with #freezeFacetOrder true', () => {
      expect(updateFacetOptions).toHaveBeenCalled();
    });
  });

  describe('#sortBy', () => {
    it('dispatches #toggleCategoryFacetValue with the passed selection', () => {
      const sortCriterion: CategoryFacetSortCriterion = 'alphanumeric';
      categoryFacet.sortBy(sortCriterion);
      expect(updateCategoryFacetSortCriterion).toHaveBeenCalledWith({
        facetId,
        criterion: sortCriterion,
      });
    });

    it('dispatches #updateFacetOptions with #freezeFacetOrder true', () => {
      categoryFacet.sortBy('alphanumeric');
      expect(updateFacetOptions).toHaveBeenCalled();
    });
  });

  it('#isSortedBy returns correct value', () => {
    expect(categoryFacet.isSortedBy('alphanumeric')).toBe(false);
    expect(categoryFacet.isSortedBy('occurrences')).toBe(true);
  });
});
