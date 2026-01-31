import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineComment from '../../models/comments.js';
import defineUser from '../../models/users.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromRunCaseId } = visibilityMiddleware(sequelize);
  const Comment = defineComment(sequelize, DataTypes);
  const User = defineUser(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromRunCaseId, async (req, res) => {
    const { runCaseId, commentableType, commentableId } = req.query;

    // Support both old (runCaseId) and new (commentableType/Id) parameters
    let whereClause;
    if (commentableType && commentableId) {
      whereClause = {
        commentableType: commentableType,
        commentableId: commentableId,
      };
    } else if (runCaseId) {
      // Backward compatibility
      whereClause = {
        commentableType: 'RunCase',
        commentableId: runCaseId,
      };
    } else {
      return res.status(400).json({ error: 'commentableType and commentableId, or runCaseId is required' });
    }

    try {
      const comments = await Comment.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });
      res.json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
