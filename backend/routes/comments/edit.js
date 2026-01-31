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

  router.post('/edit', verifySignedIn, verifyProjectReporterFromRunCaseId, async (req, res) => {
    const { id, content } = req.body;

    if (!id || !content) {
      return res.status(400).json({ error: 'id and content are required' });
    }

    try {
      const comment = await Comment.findByPk(id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Verify the user owns the comment
      if (comment.userId !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await comment.update({ content });

      // Fetch the comment with user data
      const commentWithUser = await Comment.findByPk(id, {
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
