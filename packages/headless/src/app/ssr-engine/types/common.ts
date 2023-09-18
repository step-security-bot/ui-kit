import {AnyAction} from '@reduxjs/toolkit';
import {Controller} from '../../../controllers';
import {CoreEngine} from '../../engine';

export type HasKeys<TObject> = TObject extends {}
  ? keyof TObject extends never
    ? false
    : true
  : boolean;

export interface OptionsExtender<TOptions> {
  (options: TOptions): TOptions | Promise<TOptions>;
}

export interface ControllersPropsMap {
  [customName: string]: unknown;
}

export interface ControllersMap {
  [customName: string]: Controller;
}

export interface ControllerStaticState<TState> {
  state: TState;
}

export interface ControllerStaticStateMap {
  [customName: string]: ControllerStaticState<unknown>;
}
/**
 * @internal
 */
export interface ControllerDefinitionWithoutProps<
  TEngine extends CoreEngine,
  TController extends Controller,
> {
  build(engine: TEngine): TController;
}

/**
 * @internal
 */
export interface ControllerDefinitionWithProps<
  TEngine extends CoreEngine,
  TController extends Controller,
  TProps,
> {
  buildWithProps(engine: TEngine, props: TProps): TController;
}

/**
 * @internal
 */
export type ControllerDefinition<
  TEngine extends CoreEngine,
  TController extends Controller,
> =
  | ControllerDefinitionWithoutProps<TEngine, TController>
  | ControllerDefinitionWithProps<TEngine, TController, unknown>;

/**
 * @internal
 */
export interface ControllerDefinitionsMap<
  TEngine extends CoreEngine,
  TController extends Controller,
> {
  [customName: string]: ControllerDefinition<TEngine, TController>;
}

export interface EngineStaticState<
  TSearchFulfilledAction extends AnyAction,
  TControllers extends ControllerStaticStateMap,
> {
  searchFulfilledAction: TSearchFulfilledAction;
  controllers: TControllers;
}

export interface HydratedState<
  TEngine extends CoreEngine,
  TControllers extends ControllersMap,
> {
  engine: TEngine;
  controllers: TControllers;
}

export type InferControllerPropsFromDefinition<
  TController extends ControllerDefinition<CoreEngine, Controller>,
> = TController extends ControllerDefinitionWithProps<
  CoreEngine,
  Controller,
  infer Props
>
  ? Props
  : TController extends ControllerDefinitionWithoutProps<CoreEngine, Controller>
  ? {}
  : unknown;

export type InferControllerPropsMapFromDefinitions<
  TControllers extends ControllerDefinitionsMap<CoreEngine, Controller>,
> = {
  [K in keyof TControllers as HasKeys<
    InferControllerPropsFromDefinition<TControllers[K]>
  > extends false
    ? never
    : K]: InferControllerPropsFromDefinition<TControllers[K]>;
};

/**
 * @internal
 */
export type InferControllerFromDefinition<
  TDefinition extends ControllerDefinition<CoreEngine, Controller>,
> = TDefinition extends ControllerDefinition<infer _, infer TController>
  ? TController
  : never;

/**
 * @internal
 */
export type InferControllersMapFromDefinition<
  TControllers extends ControllerDefinitionsMap<CoreEngine, Controller>,
> = {[K in keyof TControllers]: InferControllerFromDefinition<TControllers[K]>};

export type InferControllerStaticStateFromDefinition<
  TDefinition extends ControllerDefinition<CoreEngine, Controller>,
> = TDefinition extends ControllerDefinition<infer _, infer TController>
  ? ControllerStaticState<TController['state']>
  : never;

export type InferControllerStaticStateMapFromDefinitions<
  TControllers extends ControllerDefinitionsMap<CoreEngine, Controller>,
> = {
  [K in keyof TControllers]: InferControllerStaticStateFromDefinition<
    TControllers[K]
  >;
};
