<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { fetchy } from "../../utils/fetchy";
import { formatDate } from "../../utils/formatDate";
import PostToTrendComponent from "./PostToTrendComponent.vue";

const props = defineProps(["trend"]);
const emit = defineEmits(["refresh"]);
const post = ref<Record<string, string>>();
const postsToThread = ref<Array<Record<string, string>>>();
const timeout = ref<Record<string, any>>();
const loaded = ref(false);
const expanded = ref(false);

const getTrendPost = async () => {
  let p: Record<string, string>;
  try {
    p = await fetchy(`/api/posts/${props.trend?.content}`, "GET");
  } catch (_) {
    return;
  }

  let t: Record<string, any>;
  try {
    t = await fetchy(`/api/timeout/${props.trend?._id}`, "GET");
  } catch (_) {
    return;
  }

  post.value = p;
  timeout.value = t;
};

const getPostsToTrend = async () => {
  let p: Array<Record<string, string>>;
  try {
    p = await fetchy(`/api/threads/${props.trend?._id}`, "GET");
  } catch (_) {
    return;
  }

  const posts = p
    .map((t) => t.content)
    .map(async (id) => {
      let out;
      try {
        out = await fetchy(`/api/posts/${id}`, "GET");
      } catch (_) {
        return;
      }
      return out;
    });

  const out = await Promise.all(posts);
  postsToThread.value = out;
};

onBeforeMount(async () => {
  await getTrendPost();
  await getPostsToTrend();
  loaded.value = true;
});
</script>

<template>
  <p class="author">{{ post?.content }}</p>
  <p>{{ post?.author }}</p>
  <menu>
    <button v-if="!expanded" @click="expanded = true">View Trend</button>
    <button v-else @click="expanded = false">Hide Trend</button>
  </menu>
  <div v-if="loaded" class="base">
    <article class="timestamp">
      <p>Expires on {{ formatDate(timeout?.deadline) }}</p>
      <li v-for="t in postsToThread" :key="t?._id">
        <ul>
          {{
            t
          }}
        </ul>
      </li>
      <PostToTrendComponent v-if="expanded" :trend="props.trend" />
    </article>
  </div>
</template>

<style scoped>
p {
  margin: 0em;
}

.author {
  font-weight: bold;
  font-size: 1.2em;
}

menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}

.base {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.base article:only-child {
  margin-left: auto;
}
</style>
