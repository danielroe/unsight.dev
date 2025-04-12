<script setup lang="ts">
const CLOSE = 'Close'

const dialogRef = useTemplateRef('dialogRef')

const isOpen = ref(false)

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

const toggleBGScroll = (scrollLock: boolean) => {
  if (scrollLock) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const openModal = () => {
  isOpen.value = true
  toggleBGScroll(true)
}

const closeModal = () => {
  isOpen.value = false
  toggleBGScroll(false)
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)

  if (isOpen.value) {
    toggleBGScroll(false)
  }
})

defineExpose({
  openModal,
})
</script>

<template >
     <Transition name="slide-fade">
      <div 
        ref="dialogRef" 
        v-show="isOpen" 
        class="fixed inset-0 h-dvh w-dvw min-h-screen min-w-screen bg-gray-900/60 backdrop-blur-sm z-200" 
      > 
        <div 
          class="relative h-full w-full flex flex-col p-4 justify-center items-center" 
        >         
          <div class="modal-content bg-gray-800 border-solid border border-gray-700 rounded-md w-full max-w-3xl max-h-[80vh] overflow-y-auto p-8" >
            <slot name="modal-content" /> 
          </div>
          
          <button class="text-xl bg-transparent color-gray-400 py-3 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors" type="button" @click="closeModal" >
            {{ CLOSE }}
          </button>     
        </div>      
      </div>
    </Transition >    
</template>

<style >
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: scale(1.1);
    opacity: 0;
}

.modal-content {
  scrollbar-color: #808080B3 transparent;
  scrollbar-width: thin;
}
</style>
<!-- TODO: Test these inline: -->
<!-- "scrollbar scrollbar-rounded scrollbar-w-2 scrollbar-thumb-gray-500 scrollbar-track-gray-700 hover:scrollbar-thumb-gray-400" -->