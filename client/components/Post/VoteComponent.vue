<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["content"]);
const emit = defineEmits(["refreshVotes"]);
const votes = ref<Array<Record<string, string>>>([]);
const voteCount = ref<number>(0);
const user = storeToRefs(useUserStore());
const currentVote = computed(() => votes.value.filter((v) => v.user === user.currentUserId.value).at(0));

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

const onUpvoteClicked = async () => {
  if (currentVote.value && currentVote.value.vote === "upvote") {
    await removeVoteFromPost();
  } else {
    await upvotePost();
  }
};

const onDownvoteClicked = async () => {
  if (currentVote.value && currentVote.value.vote === "downvote") {
    await removeVoteFromPost();
  } else {
    await downvotePost();
  }
};

onBeforeMount(async () => {
  await getVotesOnPost();
});
</script>

<template>
  <div>
    <button :style="{ color: currentVote && currentVote.vote == 'upvote' ? 'blue' : 'black' }" @click="onUpvoteClicked">▲</button>
    <button :style="{ color: currentVote && currentVote.vote == 'downvote' ? 'blue' : 'black' }" @click="onDownvoteClicked">▼</button>
    <a>{{ voteCount }}</a>
  </div>
</template>
