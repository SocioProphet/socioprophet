import React, { useState, FormEvent } from 'react';
import firebase from 'firebase/compat/app';
import { db, auth } from '../../firebase';
import {
  StyledForm,
  StyledFormTitle,
  StyledField,
  StyledLabel,
  StyledInput,
  StyledSelect,
  StyledSubmitBtn,
  StyledError,
  StyledSignInNote,
} from './styles';

interface SubmitPostProps {
  onPostCreated: () => void;
}

const SubmitPost = ({ onPostCreated }: SubmitPostProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState<'article' | 'discussion' | 'video' | 'other'>('article');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const user = auth.currentUser;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be signed in to submit content.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setError('Title and URL are required.');
      return;
    }

    const parsedTags = tags
      .split(/[\s,]+/)
      .map((t) => t.replace(/^\//, '').toLowerCase().trim())
      .filter(Boolean)
      .slice(0, 20);

    const hostname = (() => {
      try {
        return new URL(trimmedUrl).hostname.replace(/^www\./, '');
      } catch {
        return source.trim() || 'unknown';
      }
    })();

    setSubmitting(true);
    try {
      await db.collection('posts').add({
        title: trimmedTitle,
        url: trimmedUrl,
        source: source.trim() || hostname,
        submittedBy: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        upvotes: 0,
        tags: parsedTags,
        type,
      });
      setTitle('');
      setUrl('');
      setSource('');
      setTags('');
      setType('article');
      onPostCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <StyledForm as="div">
        <StyledSignInNote>Sign in to submit content or register sources.</StyledSignInNote>
      </StyledForm>
    );
  }

  return (
    <StyledForm onSubmit={handleSubmit} aria-label="Submit new content">
      <StyledFormTitle>Submit Content</StyledFormTitle>
      <StyledField>
        <StyledLabel htmlFor="post-title">Title</StyledLabel>
        <StyledInput
          id="post-title"
          type="text"
          placeholder="Article or post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
        />
      </StyledField>
      <StyledField>
        <StyledLabel htmlFor="post-url">URL</StyledLabel>
        <StyledInput
          id="post-url"
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </StyledField>
      <StyledField>
        <StyledLabel htmlFor="post-source">Source (optional)</StyledLabel>
        <StyledInput
          id="post-source"
          type="text"
          placeholder="e.g. Reuters, Ars Technica"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          maxLength={100}
        />
      </StyledField>
      <StyledField>
        <StyledLabel htmlFor="post-tags">
          Slash-tags (space or comma separated, e.g. /tech /ai)
        </StyledLabel>
        <StyledInput
          id="post-tags"
          type="text"
          placeholder="/tech /ai /climate"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </StyledField>
      <StyledField>
        <StyledLabel htmlFor="post-type">Content type</StyledLabel>
        <StyledSelect
          id="post-type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="article">Article</option>
          <option value="discussion">Discussion</option>
          <option value="video">Video</option>
          <option value="other">Other</option>
        </StyledSelect>
      </StyledField>
      {error && <StyledError role="alert">{error}</StyledError>}
      <StyledSubmitBtn type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit'}
      </StyledSubmitBtn>
    </StyledForm>
  );
};

export default SubmitPost;
