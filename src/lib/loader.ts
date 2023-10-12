import type { WP_REST_API_Posts } from "wp-types";
import KVStore from "./Store/KVStore.ts";
import { fetchPosts } from "./posts.ts";
import type { KVNamespace } from "@cloudflare/workers-types";
import { STALE_TTL, TTL } from "../config.ts";

export const loadAllPosts = async (
  WORDPRESS_URL: string,
  KV: KVNamespace,
  waitUntil: (promise: Promise<any>) => void,
): Promise<WP_REST_API_Posts> => {
  let posts: WP_REST_API_Posts = [];
  const POSTS = KV;
  const FreshPostsStore = new KVStore<WP_REST_API_Posts>(POSTS, "FreshPosts", {
    expirationTtl: TTL,
  });
  const freshPosts = await FreshPostsStore.get();

  if (freshPosts) {
    console.log("found.");
    posts = freshPosts;
  } else {
    const FetchingState = new KVStore<boolean>(POSTS, "FetchingState", {
      expirationTtl: 60,
    });
    const StalePostsStore = new KVStore<WP_REST_API_Posts>(
      POSTS,
      "StalePosts",
      { expirationTtl: STALE_TTL },
    );
    const stalePosts = await StalePostsStore.get();

    const createFreshPosts = async () => {
      const fetchedPosts = await fetchPosts(WORDPRESS_URL);
      await FreshPostsStore.set(fetchedPosts);
      await StalePostsStore.set(fetchedPosts);
      return fetchedPosts;
    };

    if (stalePosts) {
      console.log("stale found.");
      posts = stalePosts;
      waitUntil(
        (async () => {
          if (!(await FetchingState.get())) {
            await FetchingState.set(true);
            await createFreshPosts();
            await FetchingState.set(false);
          }
        })(),
      );
    } else {
      console.log("fetched.");
      posts = await createFreshPosts();
    }
  }

  return posts;
};
