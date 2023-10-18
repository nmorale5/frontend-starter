<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["content"]);
const emit = defineEmits(["refreshVotes"]);
const votes = ref<Array<Record<string, string>>>([]);
const voteCount = ref<number>(0);

const getVotesOnPost = async () => {
  let updatedVotes: Array<Record<string, string>>;
  try {
    updatedVotes = await fetchy(`/api/votes/${props.content}`, "GET");
  } catch {
    return;
  }
  votes.value = updatedVotes;
  voteCount.value = updatedVotes.reduce((prev, next) => prev + (next.vote == "upvote" ? 1 : -1), 0);
};

const upvotePost = async () => {
  try {
    await fetchy(`/api/votes/${props.content}/upvote`, "PUT");
  } catch {
    return;
  }
  await getVotesOnPost();
};

const downvotePost = async () => {
  try {
    await fetchy(`/api/votes/${props.content}/downvote`, "PUT");
  } catch {
    return;
  }
  await getVotesOnPost();
};

const removeVoteFromPost = async () => {
  try {
    await fetchy(`/api/votes/${props.content}`, "DELETE");
  } catch {
    return;
  }
  await getVotesOnPost();
};

onBeforeMount(async () => {
  await getVotesOnPost();
});
</script>

<template>
  <div>
    <button @click="upvotePost">Upvote</button>
    <button @click="downvotePost">Downvote</button>
    <button @click="removeVoteFromPost">Remove Vote</button>
    <a>{{ voteCount }}</a>
  </div>
</template>
