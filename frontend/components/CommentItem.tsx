import { useContext, useState } from 'react';
import { Button, Textarea, Card, CardBody, addToast } from '@heroui/react';
import { Trash2, Edit2 } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { CommentType } from '@/types/comment';
import { TokenContext } from '@/utils/TokenProvider';
import { logError } from '@/utils/errorHandler';
import { updateComment, deleteComment } from '@/utils/commentControl';

type Props = {
  comment: CommentType;
  isEditing: boolean;
  onStartEdit: (id: number) => void;
  onEndEdit: (id: number, content: string) => void;
  onCancelEdit: (id: number) => void;
};

export default function CommentItem({ comment, isEditing, onStartEdit, onEndEdit, onCancelEdit }: Props) {
  const context = useContext(TokenContext);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateComment = async (id: number) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await updateComment(context.token.access_token, id, editContent);
      onEndEdit(id, editContent);
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

  return (
    <Card key={comment.id} shadow="sm">
      <CardBody>
        <div className="flex items-start gap-3">
          <UserAvatar username={comment.User.username} size={24} />
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-sm">{comment.User.username}</span>
                <span className="text-xs text-default-400 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              {comment.userId === context.token.user?.id && (
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => {
                      onStartEdit(comment.id);
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
            {isEditing ? (
              <div>
                <Textarea value={editContent} onValueChange={setEditContent} minRows={3} isDisabled={isSubmitting} />
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
                      onCancelEdit(comment.id);
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
  );
}
