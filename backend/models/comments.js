function defineComment(sequelize, DataTypes) {
  const Comment = sequelize.define('Comment', {
    runCaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.RunCase, {
      foreignKey: 'runCaseId',
      onDelete: 'CASCADE',
    });
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'SET NULL',
    });
  };

  return Comment;
}

export default defineComment;
