import React from 'react';
import { Post } from './types';
import {
  StyledCard,
  StyledUpvoteBtn,
  StyledUpvoteCount,
  StyledBody,
  StyledTitle,
  StyledMeta,
  StyledTagList,
  StyledTag,
  StyledTypeBadge,
} from './styles';

interface PostCardProps {
  post: Post;
  onUpvote: (postId: string) => void;
  onTagClick: (tag: string) => void;
  upvoted: boolean;
}

const PostCard = ({ post, onUpvote, onTagClick, upvoted }: PostCardProps) => {
  const hostname = (() => {
    try {
      return new URL(post.url).hostname.replace(/^www\./, '');
    } catch {
      return post.source;
    }
  })();

  const age = (() => {
    if (!post.createdAt) return '';
    const diffMs = Date.now() - post.createdAt.seconds * 1000;
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return 'just now';
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  })();

  return (
    <StyledCard>
      <StyledUpvoteBtn
        active={upvoted}
        onClick={() => onUpvote(post.id)}
        title={upvoted ? 'Already upvoted' : 'Upvote'}
        aria-label={`Upvote: ${post.title}`}
        aria-pressed={upvoted}
      >
        ▲
        <StyledUpvoteCount>{post.upvotes}</StyledUpvoteCount>
      </StyledUpvoteBtn>
      <StyledBody>
        <StyledTitle href={post.url} target="_blank" rel="noopener noreferrer">
          {post.title}
        </StyledTitle>
        <StyledMeta>
          <StyledTypeBadge>{post.type}</StyledTypeBadge>
          {hostname}
          {age && ` · ${age}`}
          {post.source && post.source !== hostname && ` · via ${post.source}`}
        </StyledMeta>
        {post.tags.length > 0 && (
          <StyledTagList>
            {post.tags.map((tag) => (
              <StyledTag key={tag} onClick={() => onTagClick(tag)}>
                /{tag}
              </StyledTag>
            ))}
          </StyledTagList>
        )}
      </StyledBody>
    </StyledCard>
  );
};

export default PostCard;
