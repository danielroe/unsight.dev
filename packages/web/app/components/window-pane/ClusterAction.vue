<script setup lang="ts">
import type ClusterViewModal from '../ClusterViewModal.vue'
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

const NO_MORE_ISSUES = 'no more issues...'

interface ShowMoreIssuesProps {
    cluster: ClusterMetadata;
    clusterIndex: number;
    clusterLength: number;
}

const { cluster, clusterIndex, clusterLength } = defineProps<ShowMoreIssuesProps>()

const modalRef = useTemplateRef<InstanceType<typeof ClusterViewModal>>('modalRef')
    
const openModal = () => modalRef.value?.openModal()
</script>

<template >
    <section class="w-full h-10 p-2 text-sm text-center rounded-md border-solid border border-gray-700 color-gray-400">
        <div v-if="clusterLength > 9" >
            <button
                class=" bg-transparent hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
                type="button"
                @click="openModal"
            >
                show {{ clusterLength - 9 }} more issues...
            </button>

            <Teleport to="#teleports" class=" ">
                <ClusterViewModal ref="modalRef" :cluster="cluster">
                    <template #modal-content>
                        <ClientOnly>
                            <WindowPaneClusterView :cluster="cluster" :clusterIndex="clusterIndex" :clusterTitle="cluster.title" :isModal="true" />
                        </ClientOnly>
                    </template>
                </ClusterViewModal>
            </Teleport>
        </div>
    
        <div 
            v-else
            class=" bg-transparent"
        >
            {{ NO_MORE_ISSUES}}
        </div>
    </section>
</template>
