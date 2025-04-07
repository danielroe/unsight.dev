<script setup lang="ts">
import type ClusterViewModal from '../ClusterViewModal.vue'
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

const NO_MORE_ISSUES = 'No More Issues...'

interface ShowMoreIssuesProps {
    cluster: ClusterMetadata;
    clusterIndex: number;
    clusterLength: number;
}

const { cluster, clusterIndex, clusterLength } = defineProps<ShowMoreIssuesProps>()

const modalRef = useTemplateRef<InstanceType<typeof ClusterViewModal>>('modalRef')
    
const openModal = () => modalRef.value?.openModal()
</script>

<!-- TODO: Change the name of this component -->

<template >
    <div class=" h-10 p-2 border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 whitespace-nowrap overflow-hidden text-ellipsis -mt-2 z-2 text-center " >
    <div v-if="clusterLength > 3 " >
        <button
            class=" text-sm bg-transparent color-gray-400 py-1 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
            type="button"
            @click="openModal"
        >
            show {{ clusterLength - 3 }} more issues...
        </button>

        <Teleport to="#teleports" class=" ">
            <ClusterViewModal ref="modalRef" :cluster="cluster">
                <template #modal-content>
                    <ClientOnly>
                        <PaperStackClusterView :cluster="cluster" :clusterIndex="clusterIndex" :clusterTitle="cluster.title" />
                    </ClientOnly>
                </template>
            </ClusterViewModal>
        </Teleport>
    </div>
   
    <!-- TODO: Improve the alternate state for the show more button -->
    <div v-else>{{ NO_MORE_ISSUES}}</div>
    
    </div>
</template>