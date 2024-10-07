<template>
    <div class="tag-cloud" v-if="!loading">
      <div v-for="zone in zones" :key="zone" class="zone">
        <h2>{{ zone }}</h2>
        <svg :width="zoneWidth" :height="zoneHeight" class="zone-svg">
          <!-- Apply the scaling and translation -->
          <g :transform="`translate(${zoneWidth / 2}, ${zoneHeight / 2})`">
            <!-- Central point -->
            <circle r="5" fill="#333" />
            <!-- Primary Tags -->
            <g v-for="tag in tagsByZone(zone)" :key="tag.id">
              <g :ref="el => { if (el) tagRefs[tag.id] = el }">
                <!-- Connecting line from center to primary tag -->
                <line
                  x1="0"
                  y1="0"
                  :x2="tag.x * scaleFactor"
                  :y2="tag.y * scaleFactor"
                  stroke="#ccc"
                  stroke-width="1"
                />
                <!-- Primary Tag Group -->
                <g
                  :transform="`translate(${tag.x * scaleFactor}, ${tag.y * scaleFactor}) scale(${scaleFactor})`"
                >
                  <circle
                    :r="(tag.size / 2)"
                    fill="#f0f0f0"
                    :class="{ selected: tag.selected }"
                    @click="handleTagClick(tag.id)"
                  />
                  <text
                    text-anchor="middle"
                    alignment-baseline="middle"
                    @click="handleTagClick(tag.id)"
                  >
                    {{ tag.text }}
                  </text>
                </g>
              </g>
              <!-- Secondary Tags -->
              <g
                v-if="tag.selected && tag.secondaryTags && tag.secondaryTags.length"
              >
                <g
                  v-for="secTag in tag.secondaryTags"
                  :key="secTag.id"
                  :ref="el => { if (el) tagRefs[secTag.id] = el }"
                >
                  <!-- Connecting line from primary tag to secondary tag -->
                  <line
                    :x1="tag.x * scaleFactor"
                    :y1="tag.y * scaleFactor"
                    :x2="secTag.x * scaleFactor"
                    :y2="secTag.y * scaleFactor"
                    stroke="#ccc"
                    stroke-width="1"
                  />
                  <!-- Secondary Tag Group -->
                  <g
                    :transform="`translate(${secTag.x * scaleFactor}, ${secTag.y * scaleFactor}) scale(${scaleFactor})`"
                  >
                    <circle
                      :r="(secTag.size / 2)"
                      fill="#e0e0e0"
                      :class="{ selected: secTag.selected }"
                      @click="handleSecondaryTagClick(tag.id, secTag.id)"
                    />
                    <text
                      text-anchor="middle"
                      alignment-baseline="middle"
                      @click="handleSecondaryTagClick(tag.id, secTag.id)"
                    >
                      {{ secTag.text }}
                    </text>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
    <!-- Loading indicator -->
    <div v-else class="loading">
      Loading...
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useTagStore } from '~/store/tagStore'
  import gsap from 'gsap'
  
  const tagStore = useTagStore()
  const { zones, tagsByZone } = storeToRefs(tagStore)
  const { toggleTag, toggleSecondaryTag, fetchTags } = tagStore
  
  const zoneWidth = 400
  const zoneHeight = 400
  const baseTagSize = 40
  const selectedTagSize = 80
  const baseSecondaryTagSize = 30
  const selectedSecondaryTagSize = 60
  
  const tagRefs = ref({})
  const scaleFactor = ref(1)
  const loading = ref(true);
  onMounted(async () => {
  await fetchTags();
  loading.value = false;
  layoutTags();
});
  
  watch(() => tagStore.tags, layoutTags, { deep: true })
 
  async function layoutTags() {
  zones.value.forEach((zone) => {
    const tags = tagsByZone.value(zone);
    positionPrimaryTags(tags);

    tags.forEach((tag) => {
      if (tag.selected && tag.secondaryTags && tag.secondaryTags.length) {
        positionSecondaryTags(tag);
      }
    });
  });

  calculateScaleFactor(tagStore.tags);

  // Ensure that positions are set before rendering
  await nextTick();

  animateTags(tagStore.tags);
}
  
function positionPrimaryTags(tags) {
  const radius = (Math.min(zoneWidth, zoneHeight) / 2) - 100; // Increased margin
  const totalSize = tags.reduce((sum, tag) => sum + tag.size, 0);
  let angleOffset = 0;

  tags.forEach(tag => {
    const tagAngle = (tag.size / totalSize) * Math.PI * 2;
    const angle = angleOffset + tagAngle / 2;
    angleOffset += tagAngle;

    tag.x = radius * Math.cos(angle);
    tag.y = radius * Math.sin(angle);
  });
}
  
  function positionSecondaryTags(primaryTag) {
  const numBranches = 3; // Number of branches
  const angleToPrimary = Math.atan2(primaryTag.y, primaryTag.x);

  // Define the angle spread for branches (e.g., +/- 45 degrees)
  const branchAngleSpread = (Math.PI / 180) * 90; // 90 degrees in radians

  // Calculate the starting angle for branches
  const startAngle = angleToPrimary - branchAngleSpread / 2;

  // Divide secondary tags among branches
  const branchTags = Array.from({ length: numBranches }, () => []);

  primaryTag.secondaryTags.forEach((secTag, index) => {
    const branchIndex = index % numBranches;
    branchTags[branchIndex].push(secTag);
  });

  // Position secondary tags along each branch
  branchTags.forEach((tagsInBranch, branchIndex) => {
    const angle = startAngle + (branchIndex / (numBranches - 1)) * branchAngleSpread;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    tagsInBranch.forEach((secTag, index) => {
      // Adjust distance based on index for Fibonacci-like growth
      const distance = primaryTag.size / 2 + 50 + index * 40; // Adjust as needed

      // Calculate the position relative to the primary tag
      secTag.x = primaryTag.x + dirX * distance;
      secTag.y = primaryTag.y + dirY * distance;
    });
  });
}
  
function calculateScaleFactor(tags) {
  const maxRadius = Math.min(zoneWidth, zoneHeight) / 2 - 20; // Extra margin
  let maxExtent = 0;

  tags.forEach((tag) => {
    const tagDistance =
      Math.sqrt(tag.x ** 2 + tag.y ** 2) + (tag.size * scale) / 2;
    maxExtent = Math.max(maxExtent, tagDistance);

    if (tag.selected && tag.secondaryTags && tag.secondaryTags.length) {
      tag.secondaryTags.forEach((secTag) => {
        const secTagDistance =
          Math.sqrt(secTag.x ** 2 + secTag.y ** 2) + (secTag.size * scale) / 2;
        maxExtent = Math.max(maxExtent, secTagDistance);
      });
    }
  });

  scaleFactor.value = Math.min(1, maxRadius / maxExtent);
}


function animateTags(tags) {
  tags.forEach((tag) => {
    const el = tagRefs.value[tag.id];
    if (el) {
      gsap.to(el, {
        duration: 0.5,
        x: tag.x * scaleFactor.value,
        y: tag.y * scaleFactor.value,
        scale: tag.selected ? 2 * scaleFactor.value : scaleFactor.value,
        ease: 'elastic.out(1, 0.5)',
      });
    }

    if (tag.selected && tag.secondaryTags && tag.secondaryTags.length) {
      tag.secondaryTags.forEach((secTag) => {
        const secEl = tagRefs.value[secTag.id];
        if (secEl) {
          gsap.to(secEl, {
            duration: 0.5,
            x: secTag.x * scaleFactor.value,
            y: secTag.y * scaleFactor.value,
            scale: secTag.selected
              ? 1.5 * scaleFactor.value
              : scaleFactor.value,
            ease: 'elastic.out(1, 0.5)',
          });
        }
      });
    }
  });
}

  
  function handleTagClick(id: string) {
    toggleTag(id)
    const tag = tagStore.tags.find(t => t.id === id)
    if (tag) {
      tag.size = tag.selected ? selectedTagSize : baseTagSize
    }
    layoutTags()
  }
  
  function handleSecondaryTagClick(primaryId: string, secondaryId: string) {
    toggleSecondaryTag(primaryId, secondaryId)
    layoutTags()
  }
  </script>
  
  <style lang="scss" scoped>
  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  
  .zone {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .zone-svg {
    circle {
      transition: fill 0.3s ease;
      &.selected {
        fill: #4CAF50;
      }
    }
  
    text {
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }
  }
  </style>