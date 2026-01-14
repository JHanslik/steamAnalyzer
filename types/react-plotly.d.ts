declare module 'react-plotly.js' {
  import { Component, CSSProperties } from 'react';

  export interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    style?: CSSProperties;
    className?: string;
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
    onPurge?: (figure: any, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    debug?: boolean;
    useResizeHandler?: boolean;
    revision?: number;
  }

  export default class Plot extends Component<PlotParams> {}
}
