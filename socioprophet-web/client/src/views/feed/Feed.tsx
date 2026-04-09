import React, { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import { db, auth } from '../../firebase';
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';
import PostCard from '../../components/postCard/PostCard';
import SlashTopics from '../../components/slashTopics/SlashTopics';
import SubmitPost from '../../components/submitPost/SubmitPost';
import { Post } from '../../components/postCard/types';
import {
  StyledFeedLayout,
  StyledFeedHeading,
  StyledFeedSubtitle,
  StyledEmptyState,
  StyledLoadingState,
  StyledSection,
} from './styles';

const UPVOTED_KEY = 'sp_upvoted_posts';

const getUpvotedSet = (): Set<string> => {
  try {
    const raw = localStorage.getItem(UPVOTED_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

const saveUpvotedSet = (set: Set<string>) => {
  try {
    localStorage.setItem(UPVOTED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // best-effort
  }
};

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState<Set<string>>(getUpvotedSet);
  const [authUser, setAuthUser] = useState<firebase.User | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setAuthUser(u));
    return unsub;
  }, []);

  const loadPosts = useCallback(() => {
    setLoading(true);
    let query: firebase.firestore.Query = db
      .collection('posts')
      .orderBy('upvotes', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(50);

    if (activeTag) {
      query = db
        .collection('posts')
        .where('tags', 'array-contains', activeTag)
        .orderBy('upvotes', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(50);
    }

    const unsub = query.onSnapshot(
      (snap) => {
        const items: Post[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, 'id'>),
        }));
        setPosts(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return unsub;
  }, [activeTag]);

  useEffect(() => {
    const unsub = loadPosts();
    return unsub;
  }, [loadPosts]);

  const handleUpvote = async (postId: string) => {
    if (!authUser) return;
    if (upvoted.has(postId)) return;

    const ref = db.collection('posts').doc(postId);
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      await ref.update({ upvotes: post.upvotes + 1 });
      const next = new Set(upvoted);
      next.add(postId);
      setUpvoted(next);
      saveUpvotedSet(next);
    } catch {
      // silently ignore; user may not be signed in
    }
  };

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  };

  return (
    <>
      <Header />
      <StyledFeedLayout>
        <StyledFeedHeading>Content Feed</StyledFeedHeading>
        <StyledFeedSubtitle>
          Community-aggregated news and knowledge. Upvote to surface quality content.
          Filter by slash-topic or submit your own links.
        </StyledFeedSubtitle>

        <SubmitPost onPostCreated={() => {}} />

        <SlashTopics activeTag={activeTag} onSelect={setActiveTag} />

        <StyledSection aria-label="Posts">
          {loading && <StyledLoadingState>Loading…</StyledLoadingState>}
          {!loading && posts.length === 0 && (
            <StyledEmptyState>
              {activeTag
                ? `No posts tagged /${activeTag} yet. Be the first to submit one!`
                : 'No posts yet. Be the first to submit content!'}
            </StyledEmptyState>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpvote={handleUpvote}
              onTagClick={handleTagClick}
              upvoted={upvoted.has(post.id)}
            />
          ))}
        </StyledSection>
      </StyledFeedLayout>
      <Footer />
    </>
  );
};

export default Feed;
