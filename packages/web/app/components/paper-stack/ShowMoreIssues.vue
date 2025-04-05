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
    
// TODO: Change the name of this component

const openModal = () => modalRef.value?.openModal()
</script>

<template >
    <div class="text-center " >
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
                        <ClusterView :cluster="cluster" :clusterIndex="clusterIndex" />
                    </ClientOnly>
                </template>
            </ClusterViewModal>
        </Teleport>
    </div>
   
    <!-- TODO: Improve the alternate state for the show more button -->
    <div v-else>{{ NO_MORE_ISSUES}}</div>
    
    </div>
</template>