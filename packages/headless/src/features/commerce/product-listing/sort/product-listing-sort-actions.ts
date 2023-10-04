import {SortBy, SortCriterion} from '../../../sort/sort';
import {validatePayload} from '../../../../utils/validate-payload';
import {SchemaDefinition} from '@coveo/bueno';
import {EnumValue} from '@coveo/bueno';
import {createAction} from '@reduxjs/toolkit';

export const applySort = createAction(
  'commerce/productListing/sort/apply',
  (payload: SortCriterion) =>
    validatePayload(payload, {
      by: new EnumValue<SortBy>({
        enum: SortBy,
        required: true,
      }),
    } as SchemaDefinition<SortCriterion>)
);