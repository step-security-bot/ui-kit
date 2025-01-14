import {FacetRequest} from '../../../../facets/facet-set/interfaces/request';
import {AnyFacetValueRequest} from '../../../../facets/generic/interfaces/generic-facet-request';
import {FacetType} from './response';

export type AnyCommerceFacetRequest = Pick<
  FacetRequest,
  | 'facetId'
  | 'field'
  | 'numberOfValues'
  | 'isFieldExpanded'
  | 'preventAutoSelect'
> & {
  displayName: string;
  type: FacetType;
  values: AnyFacetValueRequest[];
  initialNumberOfValues: number;
};

export type CommerceFacetRequest<T extends AnyFacetValueRequest> = Omit<
  AnyCommerceFacetRequest,
  'values'
> & {
  values: T[];
};
