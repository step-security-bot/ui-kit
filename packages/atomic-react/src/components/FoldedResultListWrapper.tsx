import React, {useEffect, useRef} from 'react';
import type {JSX as AtomicJSX} from '@coveo/atomic';
import type {FoldedResult} from '@coveo/atomic/headless';
import {AtomicFoldedResultList} from './stencil-generated';
import ReactDOMServer from 'react-dom/server';

/**
 * The properties of the AtomicFoldedResultList component
 */
interface WrapperProps extends AtomicJSX.AtomicFoldedResultList {
  /**
   * A template function that takes a result item and outputs its target rendering as a JSX element.
   * It can be used to conditionally render different type of result templates based on the properties of each result.
   */
  template: (foldedResult: FoldedResult) => JSX.Element;
}

/**
 * This component serves as a wrapper for the core AtomicResultList.
 *
 * @param props
 * @returns
 */
export const FoldedResultListWrapper: React.FC<WrapperProps> = (props) => {
  const {template, ...otherProps} = props;
  const foldedResultListRef = useRef<HTMLAtomicFoldedResultListElement>(null);
  useEffect(() => {
    foldedResultListRef.current?.setRenderFunction((foldedResult) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = ReactDOMServer.renderToString(template(foldedResult));
      return wrapper;
    });
  }, [foldedResultListRef]);
  return <AtomicFoldedResultList ref={foldedResultListRef} {...otherProps} />;
};