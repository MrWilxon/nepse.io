declare module "react-grid-layout" {
  import { Component } from "react";
  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }
  export interface ResponsiveGridLayoutProps {
    className?: string;
    layouts?: { lg?: Layout[]; md?: Layout[]; sm?: Layout[]; xs?: Layout[] };
    breakpoints?: { lg?: number; md?: number; sm?: number; xs?: number };
    cols?: { lg?: number; md?: number; sm?: number; xs?: number };
    rowHeight?: number;
    width?: number;
    margin?: [number, number] | [number, number, number, number];
    containerPadding?: [number, number] | [number, number, number, number] | null;
    isDraggable?: boolean;
    isResizable?: boolean;
    onLayoutChange?: (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => void;
    onDragStop?: (currentLayout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    onResizeStop?: (currentLayout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
    children?: React.ReactNode;
    draggableHandle?: string;
    compactType?: "vertical" | "horizontal" | null;
    useCSSTransforms?: boolean;
  }
  export class Responsive extends Component<ResponsiveGridLayoutProps> {}
  export class WidthProvider extends Component<any> {}
  export type LayoutType = Layout;
}

declare module "react-grid-layout/css/styles.css" {}
declare module "react-resizable/css/styles.css" {}
