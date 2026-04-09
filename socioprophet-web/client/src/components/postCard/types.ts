export interface Post {
  id: string;
  title: string;
  url: string;
  source: string;
  submittedBy: string;
  createdAt: { seconds: number } | null;
  upvotes: number;
  tags: string[];
  type: 'article' | 'discussion' | 'video' | 'other';
}
