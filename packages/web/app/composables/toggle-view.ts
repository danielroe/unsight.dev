export type ViewToggleState =
  'PaperStack' |
  'GridCell' |
  'ColumnCell'

const selectedView = ref<ViewToggleState>('PaperStack')

export function useToggleViewState() {
  const toggleViewState = (event: PointerEvent) => {
    event.preventDefault()
    const button = event.currentTarget as HTMLButtonElement
    selectedView.value = button.value as ViewToggleState
  }

  return {
    selectedView,
    toggleViewState,
  }
}
