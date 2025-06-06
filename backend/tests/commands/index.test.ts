import _ from "lodash";
import { expect } from "jsr:@std/expect";
import { spy } from "jsr:@std/testing/mock";

import { schema } from "../../src/db/index.ts";
import { UserRoles } from "../../src/db/schema.ts";
import { createCommands } from "../../src/commands/index.ts";
import { createQueries } from "../../src/queries/index.ts";
import { createEvents, Event, EventType } from "../../src/events/index.ts";

import { InitializeDatabaseForTests } from "../helpers/db.ts";
import { disable_leaks_test_options } from "../helpers/disable-leaks-config.ts";

Deno.test("smoke test", disable_leaks_test_options, async () => {
  const { db, clear_db } = await InitializeDatabaseForTests();

  const queries = createQueries(db);
  const events = createEvents(queries);
  const commands = createCommands(db, queries, events);

  // Spy on events
  const events_spy = spy();
  events.subject.subscribe(events_spy);

  // Create User
  const create_user_command_result = await commands.createUser({ username: "testuser" });

  expect(create_user_command_result.success).toBe(true);
  expect(create_user_command_result.data?.user).toBeDefined();

  const user_id = create_user_command_result.data!.user!.id;

  const users_query = await db.query.users.findMany();

  expect(users_query.length).toBe(1);
  expect(users_query[0].username).toBe("testuser");
  expect(users_query[0].role).toBe(UserRoles.USER);

  // Create Post
  const create_post_command_result = await commands.createPost({
    title: "Test Post",
    url: "https://example.com",
    authorId: user_id,
  });

  expect(create_post_command_result.success).toBe(true);
  expect(create_post_command_result.data?.post.id).toBeDefined();

  const post_id = create_post_command_result.data!.post.id;

  const posts_query = await db.query.posts.findMany();

  expect(posts_query.length).toBe(1);
  expect(posts_query[0].title).toBe("Test Post");
  expect(posts_query[0].url).toBe("https://example.com");
  expect(posts_query[0].authorId).toBe(user_id);

  expect(events_spy.calls.length).toBe(1);
  let last_event = _.last(events_spy.calls)!.args[0] as Event;
  expect(last_event.type).toBe(EventType.USER_CREATED_POST);

  // Create Comment
  const create_comment_command_result = await commands.createComment({
    postId: post_id,
    authorId: user_id,
    content: "Test Comment",
  });

  expect(create_comment_command_result.success).toBe(true);
  expect(create_comment_command_result.data?.comment.id).toBeDefined();

  const comment_id = create_comment_command_result.data!.comment.id;

  const comments_query = await db.query.comments.findMany();

  expect(comments_query.length).toBe(1);
  expect(comments_query[0].content).toBe("Test Comment");
  expect(comments_query[0].authorId).toBe(user_id);
  expect(comments_query[0].score).toBe(0);

  expect(events_spy.calls.length).toBe(2);
  last_event = _.last(events_spy.calls)!.args[0] as Event;
  expect(last_event.type).toBe(EventType.USER_CREATED_COMMENT);

  // Vote Post
  const vote_post_command_result = await commands.votePost({
    postId: post_id,
    userId: user_id,
    voteType: schema.VoteType.UP_VOTE,
  });

  expect(vote_post_command_result.success).toBe(true);
  expect(vote_post_command_result.data?.newScore).toBe(1);

  expect(vote_post_command_result.data?.vote).toBeDefined();
  expect(vote_post_command_result.data?.vote.postId).toBe(post_id);
  expect(vote_post_command_result.data?.vote.userId).toBe(user_id);
  expect(vote_post_command_result.data?.vote.voteType).toBe(schema.VoteType.UP_VOTE);
  expect(vote_post_command_result.data?.vote.createdAt).toBeDefined();
  expect(vote_post_command_result.data?.vote.updatedAt).toBeDefined();

  const post_votes_query = await db.query.postVotes.findMany({ with: { post: true } });

  expect(post_votes_query.length).toBe(1);
  expect(post_votes_query[0].postId).toBe(post_id);
  expect(post_votes_query[0].userId).toBe(user_id);
  expect(post_votes_query[0].voteType).toBe(schema.VoteType.UP_VOTE);
  expect(post_votes_query[0].createdAt).toBeDefined();
  expect(post_votes_query[0].updatedAt).toBeDefined();

  expect(post_votes_query[0].post.score).toBe(1);

  // Vote Comment
  await commands.voteComment({ commentId: comment_id, userId: user_id, voteType: schema.VoteType.DOWN_VOTE });

  const comment_votes_query = await db.query.commentVotes.findMany({ with: { comment: true } });

  expect(comment_votes_query.length).toBe(1);
  expect(comment_votes_query[0].commentId).toBe(comment_id);
  expect(comment_votes_query[0].userId).toBe(user_id);
  expect(comment_votes_query[0].voteType).toBe(schema.VoteType.DOWN_VOTE);
  expect(comment_votes_query[0].createdAt).toBeDefined();
  expect(comment_votes_query[0].updatedAt).toBeDefined();

  expect(comment_votes_query[0].comment.score).toBe(-1);

  expect(events_spy.calls.length).toBe(3);
  last_event = _.last(events_spy.calls)!.args[0] as Event;
  expect(last_event.type).toBe(EventType.USER_VOTED_COMMENT);

  await clear_db();
});
