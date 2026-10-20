declare module 'react' {
  export type SetStateAction<S> = S | ((previous: S) => S)
  export type Dispatch<A> = (value: A) => void
  export interface FormEvent { preventDefault(): void }
  export interface ChangeEvent<T> { target: T }
  export interface KeyboardEvent<T> { key: string; shiftKey: boolean; currentTarget: T; preventDefault(): void }
  export function useRef<T>(initial: T): { current: T }
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T
  export const StrictMode: (props: { children?: unknown }) => unknown
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): { render(node: unknown): void }
}

declare namespace JSX {
  interface IntrinsicElements { [elementName: string]: any }
}
