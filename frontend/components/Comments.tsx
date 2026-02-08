'use client';
import { useEffect, useState, useContext } from 'react';
import { Button, Textarea, Spinner, addToast } from '@heroui/react';
import CommentItem from './CommentItem';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchComments, createComment, updateComment, deleteComment } from '@/utils/commentControl';
import { logError } from '@/utils/errorHandler';
import type { CommentType } from '@/types/comment';

type Props = {
  projectId: string;
  commentableType: 'RunCase' | 'Run' | 'Case';
  commentableId?: number;
  onCommentCountChange?: (count: number) => void;
};

export default function Comments({ projectId, commentableType, commentableId, onCommentCountChange }: Props) {
  const context = useContext(TokenContext);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadComments() {
      if (!commentableType || !commentableId || !context.isSignedIn()) return;

      setIsLoading(true);
      try {
        const data = await fetchComments(context.token.access_token, commentableType, commentableId);
        setComments(data);
        if (onCommentCountChange) {
          onCommentCountChange(data.length);
        }
      } catch (error: unknown) {
        logError('Error fetching comments', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadComments();
  }, [commentableType, commentableId, context, onCommentCountChange]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !commentableType || !commentableId) return;

    setIsSubmitting(true);
    try {
      const comment = await createComment(context.token.access_token, commentableType, commentableId, newComment);
      if (!comment) {
        throw new Error('Failed to create comment');
      }
      const updatedComments = [...comments, comment];
      setComments(updatedComments);
      setNewComment('');
      if (onCommentCountChange) {
        onCommentCountChange(updatedComments.length);
      }
      addToast({
        title: 'Success',
        color: 'success',
        description: 'Comment added',
      });
    } catch (error: unknown) {
      logError('Error adding comment', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: 'Failed to add comment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (id: number, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await updateComment(context.token.access_token, id, editContent);
      setComments(comments.map((c) => (c.id === id ? { ...c, content: editContent } : c)));
      setEditingId(null);
      setEditContent('');
      addToast({
        title: 'Success',
        color: 'success',
        description: 'Comment updated',
      });
    } catch (error: unknown) {
      logError('Error updating comment', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: 'Failed to update comment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    setIsSubmitting(true);
    try {
      await deleteComment(context.token.access_token, id);
      const updatedComments = comments.filter((c) => c.id !== id);
      setComments(updatedComments);
      if (onCommentCountChange) {
        onCommentCountChange(updatedComments.length);
      }
      addToast({
        title: 'Success',
        color: 'success',
        description: 'Comment deleted',
      });
    } catch (error: unknown) {
      logError('Error deleting comment', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: 'Failed to delete comment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!commentableType || !commentableId) {
    return (
      <div className="h-full text-default-500 flex items-center justify-center">
        <div className="text-center">
          <p>No entity selected</p>
          {!commentableType && <p>Please select a type</p>}
          {!commentableId && <p>Please select an ID</p>}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const canComment = projectId && context.isProjectReporter(Number(projectId));

  return (
    <div className="h-full flex flex-col justify-between">
      {comments.length === 0 ? (
        <div className="text-center text-default-400 py-8">
          <p>No comments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isEditing={editingId === comment.id}
              canEdit={comment.userId === context.token.user?.id}
              editContent={editContent}
              isSubmitting={isSubmitting}
              onEditContentChange={setEditContent}
              onStartEdit={() => handleStartEdit(comment.id, comment.content)}
              onCancelEdit={handleCancelEdit}
              onSave={() => handleSaveEdit(comment.id)}
              onDelete={() => handleDeleteComment(comment.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onValueChange={setNewComment}
          minRows={3}
          variant="bordered"
          isDisabled={!canComment || isSubmitting}
        />
        <Button
          color="primary"
          size="sm"
          className="mt-2"
          onPress={handleAddComment}
          isLoading={isSubmitting}
          isDisabled={!newComment.trim() || !canComment}
        >
          Comment
        </Button>
      </div>
    </div>
  );
}
