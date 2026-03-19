import { useEffect, useState } from 'react';
import { MessageSquare, Heart, Reply, Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TranslatedComment } from './TranslatedComment';

interface Comment {
  id: string;
  listing_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  user_email?: string;
  like_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  listingId: string;
  sellerId: string;
  targetLanguage?: string;
}

export function CommentSection({ listingId, sellerId, targetLanguage = 'en' }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    getCurrentUser();
    subscribeToComments();
  }, [listingId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadComments = async () => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Fetch top-level comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('listing_id', listingId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Get all user IDs we need to fetch
      const userIds = new Set((commentsData || []).map(c => c.user_id));

      // Fetch replies to get their user IDs too
      const { data: allReplies } = await supabase
        .from('comments')
        .select('*')
        .eq('listing_id', listingId)
        .not('parent_comment_id', 'is', null)
        .order('created_at', { ascending: true });

      (allReplies || []).forEach(r => userIds.add(r.user_id));

      // Fetch all user emails in one query
      const { data: usersData } = await supabase.rpc('get_user_emails', {
        user_ids: Array.from(userIds)
      });

      const userEmailMap = new Map();
      (usersData || []).forEach((u: any) => {
        userEmailMap.set(u.user_id, u.email);
      });

      const commentsWithDetails = await Promise.all(
        (commentsData || []).map(async (comment: any) => {
          // Get like count and user's like status
          const { count: likeCount } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          let isLiked = false;
          if (userId) {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', userId)
              .maybeSingle();
            isLiked = !!likeData;
          }

          // Get replies for this comment
          const repliesForComment = (allReplies || []).filter(
            r => r.parent_comment_id === comment.id
          );

          const repliesWithDetails = await Promise.all(
            repliesForComment.map(async (reply: any) => {
              const { count: replyLikeCount } = await supabase
                .from('comment_likes')
                .select('*', { count: 'exact', head: true })
                .eq('comment_id', reply.id);

              let isReplyLiked = false;
              if (userId) {
                const { data: replyLikeData } = await supabase
                  .from('comment_likes')
                  .select('id')
                  .eq('comment_id', reply.id)
                  .eq('user_id', userId)
                  .maybeSingle();
                isReplyLiked = !!replyLikeData;
              }

              return {
                ...reply,
                user_email: userEmailMap.get(reply.user_id) || 'Anonymous',
                like_count: replyLikeCount || 0,
                is_liked: isReplyLiked,
              };
            })
          );

          return {
            ...comment,
            user_email: userEmailMap.get(comment.user_id) || 'Anonymous',
            like_count: likeCount || 0,
            is_liked: isLiked,
            replies: repliesWithDetails,
          };
        })
      );

      setComments(commentsWithDetails);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `listing_id=eq.${listingId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to comment');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to reply');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          parent_comment_id: parentId,
          content: replyContent.trim(),
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    }
  };

  const handleToggleLike = async (commentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to like comments');
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
      }

      loadComments();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDisplayName = (email: string, userId: string) => {
    const username = email.split('@')[0];
    if (userId === sellerId) {
      return `${username} (Seller)`;
    }
    return username;
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {comment.user_email?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {getDisplayName(comment.user_email || 'Anonymous', comment.user_id)}
              </span>
              <span className="text-xs text-gray-500">{formatTime(comment.created_at)}</span>
            </div>
            <TranslatedComment content={comment.content} targetLanguage={targetLanguage} />
          </div>

          <div className="flex items-center gap-4 mt-2 px-2">
            <button
              onClick={() => handleToggleLike(comment.id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                comment.is_liked ? 'text-red-600 font-medium' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart size={14} fill={comment.is_liked ? 'currentColor' : 'none'} />
              {comment.like_count || 0}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Reply size={14} />
                Reply
              </button>
            )}

            {currentUserId === comment.user_id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 ml-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply(comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gray-900">
        <MessageSquare size={20} />
        <h3 className="text-lg font-semibold">
          Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h3>
      </div>

      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {currentUserId ? '?' : 'G'}
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a question or leave a comment..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Send size={16} />
              Post Comment
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
