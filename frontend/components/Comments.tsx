'use client';

import { useEffect, useState, useContext } from 'react';
import { Button, Textarea, Card, CardBody, Spinner, addToast } from '@heroui/react';
import { Trash2, Edit2, MessageSquare } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchComments, createComment, updateComment, deleteComment } from '@/utils/commentControl';
import { logError } from '@/utils/errorHandler';
import type { CommentType } from '@/types/comment';

type Props = {
  runCaseId?: number;
  onCommentCountChange?: (count: number) => void;
};

export default function Comments({ runCaseId, onCommentCountChange }: Props) {
  const context = useContext(TokenContext);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!runCaseId || !context.isSignedIn()) return;

    async function loadComments() {
      setIsLoading(true);
      try {
        const data = await fetchComments(context.token.access_token, runCaseId);
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
  }, [runCaseId, context, onCommentCountChange]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !runCaseId) return;

    setIsSubmitting(true);
    try {
      const comment = await createComment(context.token.access_token, runCaseId, newComment);
      setComments([...comments, comment]);
      setNewComment('');
      if (onCommentCountChange) {
        onCommentCountChange(comments.length + 1);
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

  const handleUpdateComment = async (id: number) => {
    if (!editContent.trim() || !runCaseId) return;

    setIsSubmitting(true);
    try {
      const updatedComment = await updateComment(context.token.access_token, id, editContent, runCaseId);
      setComments(comments.map((c) => (c.id === id ? updatedComment : c)));
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
    if (!runCaseId) return;

    setIsSubmitting(true);
    try {
      await deleteComment(context.token.access_token, id, runCaseId);
      const newComments = comments.filter((c) => c.id !== id);
      setComments(newComments);
      if (onCommentCountChange) {
        onCommentCountChange(newComments.length);
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

  if (!runCaseId) {
    return (
      <div className="h-full text-default-500 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>No test case selected</p>
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

  return (
    <div className="h-full">
      <div className="mb-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onValueChange={setNewComment}
          minRows={3}
          isDisabled={!context.isProjectReporter(0) || isSubmitting}
        />
        <Button
          color="primary"
          size="sm"
          className="mt-2"
          onPress={handleAddComment}
          isLoading={isSubmitting}
          isDisabled={!newComment.trim() || !context.isProjectReporter(0)}
        >
          Add Comment
        </Button>
      </div>

      {comments.length === 0 ? (
        <div className="text-center text-default-400 py-8">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} shadow="sm">
              <CardBody>
                <div className="flex items-start gap-3">
                  <UserAvatar
                    name={comment.User?.name || 'Unknown'}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-sm">{comment.User?.name || 'Unknown'}</span>
                        <span className="text-xs text-default-400 ml-2">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {comment.userId === context.userId && (
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setEditingId(comment.id);
                              setEditContent(comment.content);
                            }}
                            isDisabled={isSubmitting}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeleteComment(comment.id)}
                            isDisabled={isSubmitting}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingId === comment.id ? (
                      <div>
                        <Textarea
                          value={editContent}
                          onValueChange={setEditContent}
                          minRows={3}
                          isDisabled={isSubmitting}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            color="primary"
                            onPress={() => handleUpdateComment(comment.id)}
                            isLoading={isSubmitting}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="bordered"
                            onPress={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            isDisabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

