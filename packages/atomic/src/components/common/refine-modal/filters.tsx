import {FunctionalComponent, Fragment, h} from '@stencil/core';
import {i18n} from 'i18next';
import {Button} from '../button';

interface RefineModalFiltersSectionProps {
  i18n: i18n;
  withFacets: boolean;
  withAutomaticFacets: boolean;
}
export const RefineModalFiltersSection: FunctionalComponent<
  RefineModalFiltersSectionProps
> = ({i18n, withAutomaticFacets, withFacets}, children) => {
  return (
    <Fragment>
      <div part="filter-section" class="w-full flex justify-between mt-8 mb-3">
        <h1
          part="section-title section-filters-title"
          class="text-2xl font-bold truncate"
        >
          {i18n.t('filters')}
        </h1>
        {children}
      </div>
      {withFacets && <slot name="facets"></slot>}
      {withAutomaticFacets && <slot name="automatic-facets"></slot>}
    </Fragment>
  );
};

interface RefineModalFiltersClearButtonProps {
  i18n: i18n;
  onClick: () => void;
}
export const RefineModalFiltersClearButton: FunctionalComponent<
  RefineModalFiltersClearButtonProps
> = ({i18n, onClick}) => {
  return (
    <Button
      onClick={onClick}
      style="text-primary"
      text={i18n.t('clear')}
      class="px-2 py-1"
      part="filter-clear-all"
    ></Button>
  );
};
