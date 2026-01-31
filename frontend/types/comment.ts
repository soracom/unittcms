type CommentType = {
  id: number;
  commentableType: 'RunCase' | 'Run' | 'Case';
  commentableId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: number;
    name: string;
    email: string;
  };
};

type CommentMessages = {
  comments: string;
  noComments: string;
  addComment: string;
  editComment: string;
  deleteComment: string;
  save: string;
  cancel: string;
  delete: string;
  areYouSure: string;
  placeholder: string;
};

export type { CommentType, CommentMessages };
