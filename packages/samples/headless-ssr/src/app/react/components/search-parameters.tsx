'use client';

import {useEffect, useMemo} from 'react';
import {useHistoryRouter} from '../../common/search-parameters';
import {CoveoNextJsSearchParametersSerializer} from '../../common/search-parameters-serializer';
import {useSearchParameters} from '../common/engine';

export default function SearchParameters() {
  const historyRouter = useHistoryRouter();
  const {state, methods} = useSearchParameters();

  // Update the search interface.
  useEffect(
    () =>
      methods &&
      historyRouter.url?.searchParams &&
      methods.synchronize(
        CoveoNextJsSearchParametersSerializer.fromClientSideUrlSearchParams(
          historyRouter.url.searchParams
        ).coveoSearchParameters
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyRouter.url?.searchParams]
  );

  // Update the URL.
  const correctedUrl = useMemo(() => {
    if (!historyRouter.url) {
      return null;
    }
    const newURL = new URL(historyRouter.url);
    CoveoNextJsSearchParametersSerializer.fromCoveoSearchParameters(
      state.parameters
    ).applyToUrlSearchParams(newURL.searchParams);
    return newURL.href;
  }, [historyRouter.url, state.parameters]);
  useEffect(() => {
    if (!correctedUrl || correctedUrl === historyRouter.url?.href) {
      return;
    }
    const isInitialState = methods === undefined;
    if (isInitialState) {
      historyRouter.replace(correctedUrl);
    } else {
      historyRouter.push(correctedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctedUrl]);

  return <></>;
}