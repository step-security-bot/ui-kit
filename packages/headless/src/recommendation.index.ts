import {polyfillCryptoNode} from './api/analytics/analytics-crypto-polyfill';
import * as HighlightUtils from './utils/highlight';

export {HighlightUtils};

polyfillCryptoNode();
export type {Unsubscribe, Middleware} from '@reduxjs/toolkit';
export type {Relay} from '@coveo/relay';

export type {
  RecommendationEngine,
  RecommendationEngineOptions,
  RecommendationEngineConfiguration,
} from './app/recommendation-engine/recommendation-engine';
export {
  buildRecommendationEngine,
  getSampleRecommendationEngineConfiguration,
} from './app/recommendation-engine/recommendation-engine';

export type {CoreEngine, ExternalEngineOptions} from './app/engine';
export type {
  EngineConfiguration,
  AnalyticsConfiguration,
  AnalyticsRuntimeEnvironment,
} from './app/engine-configuration';
export type {LoggerOptions} from './app/logger';
export type {LogLevel} from './app/logger';

// Actions
export * from './features/configuration/configuration-actions-loader';
export * from './features/configuration/search-configuration-actions-loader';
export * from './features/advanced-search-queries/advanced-search-queries-actions-loader';
export * from './features/context/context-actions-loader';
export * from './features/dictionary-field-context/dictionary-field-context-actions-loader';
export * from './features/fields/fields-actions-loader';
export * from './features/pipeline/pipeline-actions-loader';
export * from './features/search-hub/search-hub-actions-loader';
export * from './features/debug/debug-actions-loader';
export * from './features/recommendation/recommendation-actions-loader';
export * from './features/recommendation/recommendation-click-analytics-actions-loader';
export * from './features/pagination/pagination-actions-loader';

// Controllers
export type {
  Controller,
  Subscribable,
} from './controllers/controller/headless-controller';
export {buildController} from './controllers/controller/headless-controller';

export type {
  RecommendationListOptions,
  RecommendationListProps,
  RecommendationListState,
  RecommendationList,
} from './controllers/recommendation/headless-recommendation';
export {buildRecommendationList} from './controllers/recommendation/headless-recommendation';

export type {
  RecommendationInteractiveResultOptions,
  RecommendationInteractiveResultProps,
  InteractiveResult,
  InteractiveResultCoreOptions,
  InteractiveResultCoreProps,
  InteractiveResultCore,
} from './controllers/recommendation/result-list/headless-recommendation-interactive-result';
export {buildInteractiveResult} from './controllers/recommendation/result-list/headless-recommendation-interactive-result';

export type {
  Context,
  ContextInitialState,
  ContextProps,
  ContextState,
  ContextValue,
  ContextPayload,
} from './controllers/context/headless-context';
export {buildContext} from './controllers/context/headless-context';

export type {
  DictionaryFieldContext,
  DictionaryFieldContextState,
  DictionaryFieldContextPayload,
} from './controllers/dictionary-field-context/headless-dictionary-field-context';
export {buildDictionaryFieldContext} from './controllers/dictionary-field-context/headless-dictionary-field-context';

// Miscellaneous
export type {Result} from './api/search/search/result';
export type {HighlightKeyword} from './utils/highlight';
export type {Raw} from './api/search/search/raw';

// Features
export type {
  ResultTemplate,
  ResultTemplateCondition,
} from './features/result-templates/result-templates';
export type {ResultTemplatesManager} from './features/result-templates/result-templates-manager';
export {buildResultTemplatesManager} from './features/result-templates/result-templates-manager';

export {ResultTemplatesHelpers} from './features/result-templates/result-templates-helpers';

export {
  MinimumFieldsToInclude,
  DefaultFieldsToInclude,
  EcommerceDefaultFieldsToInclude,
} from './features/fields/fields-state';

export {getOrganizationEndpoints} from './api/platform-client';
export type {PlatformEnvironment} from './utils/url-utils';
