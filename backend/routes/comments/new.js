import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineComment from '../../models/comments.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectReporterFromRunCaseId } = editableMiddleware(sequelize);
  const Comment = defineComment(sequelize, DataTypes);

  router.post('/new', verifySignedIn, verifyProjectReporterFromRunCaseId, async (req, res) => {
    const { runCaseId, commentableType, commentableId, content } = req.body;

    // Support both old (runCaseId) and new (commentableType/Id) parameters
    let finalCommentableType;
    let finalCommentableId;

    if (commentableType && commentableId) {
      finalCommentableType = commentableType;
      finalCommentableId = commentableId;
    } else if (runCaseId) {
      // Backward compatibility
      finalCommentableType = 'RunCase';
      finalCommentableId = runCaseId;
    } else {
      return res.status(400).json({ error: 'commentableType and commentableId, or runCaseId is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    try {
      const newComment = await Comment.create({
        commentableType: finalCommentableType,
        commentableId: finalCommentableId,
        userId: req.userId,
        content: content,
      });

      // Fetch the comment with user data
      const commentWithUser = await Comment.findByPk(newComment.id, {
        include: [
          {
            model: sequelize.models.User,
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      res.json(commentWithUser);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
