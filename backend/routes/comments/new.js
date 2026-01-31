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
    const { runCaseId, content } = req.body;

    if (!runCaseId || !content) {
      return res.status(400).json({ error: 'runCaseId and content are required' });
    }

    try {
      const newComment = await Comment.create({
        runCaseId: runCaseId,
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
