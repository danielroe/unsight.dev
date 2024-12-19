/** Extension name, defined in packageJson.name */
declare const __DEV__: boolean
declare const __NAME__: string

declare module '*.vue' {
  const component: any
  export default component
}

interface ImportMetaEnv {
  readonly VITE_UNSIGHT_DOT_DEV_BASE_URL: string
}
