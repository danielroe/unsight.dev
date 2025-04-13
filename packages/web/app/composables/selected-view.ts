export type ViewToggleState =
  'PaperStack' |
  'WindowPane' |
  'BookShelf'

const selectedView = ref<ViewToggleState>('PaperStack')

export function useSelectedView() {
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
