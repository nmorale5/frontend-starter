<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount, ref } from "vue";
import CreateTrendForm from "./CreateTrendForm.vue";
import TrendComponent from "./TrendComponent.vue";

const user = storeToRefs(useUserStore());
// trends is a list of objects containing
//   content: the id of the associated start trend post
//   type: this should always be "trend"
//   _id: the id of the trend itself, needed to get children
const allTrends = ref<Array<Record<string, string>>>([]);
const friendTrends = ref<Array<Record<string, string>>>([]);
const myTrends = ref<Array<Record<string, string>>>([]);
const loaded = ref(false);
const makingTrend = ref(false);
const filter = ref<"all" | "friends" | "me">("all");

const filteredTrends = computed(() => (filter.value === "all" ? allTrends.value : myTrends.value));

async function getTrends() {
  // get all timeouts that are still ongoing
  let allActive: Array<Record<string, string>>;
  try {
    allActive = await fetchy("/api/timeout/active", "GET");
  } catch (_) {
    return;
  }

  let trends: Array<Record<string, string>>;
  try {
    trends = await fetchy("/api/threads", "GET", { query: { type: "trend" } });
  } catch (_) {
    return;
  }

  let allPosts: Array<Record<string, string>>;
  try {
    allPosts = await fetchy("/api/posts", "GET");
  } catch (_) {
    return;
  }

  const activeTrends = trends.filter((t) => allActive.some((r) => r.content === t._id));
  allTrends.value = activeTrends;
  friendTrends.value = activeTrends;
  myTrends.value = activeTrends.filter((t) => allPosts.some((p) => p._id === t.content && p.author === user.currentUserId.value));
}

onBeforeMount(async () => {
  await getTrends();
  loaded.value = true;
});
</script>

<template>
  <section v-if="!makingTrend">
    <button v-if="user.isLoggedIn" @click="makingTrend = true">+ Start Trend</button>
    <h2>Trends</h2>
    <div>
      <button :style="{ color: filter === 'all' ? 'blue' : 'black' }" @click="filter = 'all'">All Trends</button>
      <!-- <button :style="{ color: filter === 'friends' ? 'blue' : 'black' }" @click="filter = 'friends'">Friends</button> -->
      <button :style="{ color: filter === 'me' ? 'blue' : 'black' }" @click="filter = 'me'">My Trends</button>
    </div>
    <article v-for="trend in filteredTrends" :key="trend._id">
      <TrendComponent :trend="trend" @refresh="getTrends" />
    </article>
  </section>
  <section v-else>
    <CreateTrendForm @refresh="getTrends" @done="makingTrend = false" v-if="user.isLoggedIn" />
    <article v-else>
      <p>You must be logged in to create a trend</p>
      <button @click="makingTrend = false">Return</button>
    </article>
  </section>
</template>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

section,
p,
.row {
  margin: 0 auto;
  max-width: 60em;
}

article {
  background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

.posts {
  padding: 1em;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 60em;
}
</style>
