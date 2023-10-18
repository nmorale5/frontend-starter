import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Friend, Post, Thread, Timeout, User, Vote, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // get all votes for the current post
  @Router.get("/votes/:content")
  async getAllVotes(content: ObjectId) {
    return await Vote.getVotes(content);
  }

  // upvote a post. Also removes a downvote if one exists for this user
  @Router.put("/votes/:content/upvote")
  async sendUpvote(session: WebSessionDoc, content: ObjectId) {
    const user = WebSession.getUser(session);
    return await Vote.setVote(content, user, true);
  }

  // downvote a post. Also removes an upvote if one exists for this user
  @Router.put("/votes/:content/downvote")
  async sendDownvote(session: WebSessionDoc, content: ObjectId) {
    const user = WebSession.getUser(session);
    return await Vote.setVote(content, user, false);
  }

  // remove the vote status (i.e., an upvote or downvote) on a post
  @Router.delete("/votes/:content")
  async deleteVote(session: WebSessionDoc, content: ObjectId) {
    const user = WebSession.getUser(session);
    return await Vote.removeVote(content, user);
  }

  // get all existing threads
  @Router.get("/threads")
  async getThreads() {
    return await Thread.getAllThreads();
  }

  // get all posts from the given thread
  @Router.get("/threads/:thread")
  async getPostsFromThread(thread: ObjectId) {
    console.log(thread, typeof thread);
    return await Thread.getAllFromThread(thread);
  }

  // create a new thread
  @Router.post("/threads")
  async createThread(content: ObjectId) {
    return await Thread.createThread(content);
  }

  // add the given post to the given thread
  @Router.post("/threads/:thread/:post")
  async addThread(session: WebSessionDoc, thread: ObjectId, post: ObjectId) {
    return await Thread.linkToThread(post, thread);
  }

  // removes a post from a thread
  @Router.delete("/threads/:thread/:post")
  async removeFromThread(thread: ObjectId, post: ObjectId) {
    return await Thread.removeFromThread(thread, post);
  }

  // deletes a thread and all posts related to it
  @Router.delete("/threads/:thread")
  async deleteThread(thread: ObjectId) {
    return await Thread.deleteThread(thread);
  }

  @Router.get("/comments/:parent")
  async getComments(parent: ObjectId) {
    const comments = (await Thread.getAllFromThread(parent)).map(async (doc) => {
      return (await Post.getPosts({ _id: doc.content })).at(0);
    });
    return (await Promise.all(comments)).filter((x) => x !== undefined);
  }

  @Router.post("/comments/:parent")
  async createComment(session: WebSessionDoc, content: string, parent: ObjectId) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content);
    await Thread.linkToThread(created.post!._id, parent);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/comments/:_id")
  async updateComment(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/comments/:_id")
  async deleteComment(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    const parent = await Thread.getParent(_id);
    await Thread.removeFromThread(_id, parent);
    return Post.delete(_id);
  }

  // view all notifications for the user in the current session
  @Router.get("/notifications")
  async getNotifications(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const friends = await Friend.getFriends(user);
    // eslint-disable-next-line prettier/prettier
    const following = friends.concat(
      (await Friend.getRequests(user))
        .filter(req => req.from.equals(user))
        .map(req => req.to));
    // eslint-disable-next-line prettier/prettier
    const postFromFolloweeNotifs =
      (await Promise.all(following.map(Post.getByAuthor))).flat();
    // eslint-disable-next-line prettier/prettier
    const commentOnMyPostNotifs =
      (await Promise.all((await Post.getByAuthor(user))
        .map(async (post) =>
          await Thread.getAllFromThread(post._id))))
        .flat();
    return {
      commentOnMyPostNotifs,
      postFromFolloweeNotifs,
    };
  }

  // Get all deadlines that have been created
  @Router.get("/timeout")
  async getAllDeadlines() {
    return {
      all: await Timeout.getAllDeadlines("all"),
      active: await Timeout.getAllDeadlines("active"),
      expired: await Timeout.getAllDeadlines("expired"),
    };
  }

  // determine whether the given content is still active, or if it expired
  @Router.get("/timeout/:content")
  async isActive(content: ObjectId) {
    return await Timeout.isActive(content);
  }

  // sets a timeout for duration seconds in the future
  @Router.post("/timeout/:content/:duration")
  async setTimeoutForDuration(content: ObjectId, duration: number) {
    const deadline = new Date(new Date().getTime() + duration * 1000);
    return await Timeout.setTimeout(content, deadline);
  }
}

export default getExpressRouter(new Routes());
