<script setup lang="ts">
// import type { onClickOutside } from '@vueuse/core'
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ShowMoreIssuesProps {
    cluster: ClusterMetadata;

}

const { cluster } = defineProps<ShowMoreIssuesProps>()

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

// TODO: Maybe just pass the index to identify the cluster down to this component instead and then I can useNuxtData inside of the modal?

// const setSelectedCluster = useSelectedCluster()

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

// console.log('ClusterViewModal.issues', cluster.issues)

defineExpose({
  openModal,
})
</script>

<template >
     <Transition name="slide-fade">
      <div 
        ref="dialogRef" 
        v-if="isOpen" 
        class="fixed inset-0 h-dvh w-dvw min-h-screen min-w-screen bg-gray-900/60 backdrop-blur-sm z-20" 
      > 
        <div 
          class="relative h-full w-full flex flex-col p-4 justify-center items-center" >         
          <div class="bg-gray-800 border-solid border border-gray-700 rounded-md w-full max-w-3xl max-h-[80vh] overflow-y-auto" >
            <slot name="modal-content" /> 
          </div>
          
          <button class="text-lg bg-transparent color-gray-400 py-1 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors" type="button" @click="closeModal" >
            Close
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




</style>
