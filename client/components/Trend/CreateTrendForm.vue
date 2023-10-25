<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const content = ref("");
const duration = ref("");
const emit = defineEmits(["refresh", "done"]);

const createTrend = async (desc: string, durationDays: number) => {
  console.log(desc, durationDays);
  // make post with desc to create the new trend
  let trendStartPost;
  try {
    trendStartPost = await fetchy("/api/posts", "POST", {
      body: { content: desc },
    });
  } catch (_) {
    return;
  }
  console.log(trendStartPost.post);

  // start a new thread with this post id as the parent
  let threadId;
  try {
    threadId = await fetchy("/api/threads", "POST", {
      body: { content: trendStartPost.post._id, type: "trend" },
    });
  } catch (_) {
    return;
  }
  console.log(threadId);

  // start a new timeout with the thread
  try {
    await fetchy(`/api/timeout/${threadId}/${durationDays}`, "POST");
  } catch (_) {
    return;
  }
  console.log("here");

  emit("refresh");
  emit("done");
  emptyForm();
};

const emptyForm = () => {
  content.value = "";
};
</script>

<template>
  <h2>Start New Trend</h2>
  <button @click="emit('done')">Cancel</button>
  <form @submit.prevent="createTrend(content, parseFloat(duration))">
    <label for="content">Post Contents:</label>
    <textarea id="content" v-model="content" placeholder="Kick off a new trend! (e.g., 'tell me a story about...' or 'Share your favorite...?')" required> </textarea>
    <label for="duration-dropdown">Duration:</label>
    <select id="duration-dropdown" v-model="duration" required>
      <option value="1/1440">1 min</option>
      <option value="3/1440">3 mins</option>
      <option value="1">1 day</option>
      <option value="2">2 days</option>
      <option value="3">3 days</option>
      <option value="4">4 days</option>
      <option value="5">5 days</option>
      <option value="6">6 days</option>
      <option value="7">7 days</option>
    </select>
    <button type="submit" class="pure-button-primary pure-button">Create Trend</button>
  </form>
</template>

<style scoped>
form {
  background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  padding: 0.5em;
  border-radius: 4px;
  resize: none;
}
</style>
