export async function up(queryInterface, Sequelize) {
  // Add new polymorphic columns
  await queryInterface.addColumn('comments', 'commentableType', {
    type: Sequelize.STRING,
    allowNull: true, // Temporarily nullable for migration
  });

  await queryInterface.addColumn('comments', 'commentableId', {
    type: Sequelize.INTEGER,
    allowNull: true, // Temporarily nullable for migration
  });

  // Migrate existing data: convert runCaseId to polymorphic structure
  await queryInterface.sequelize.query(`
    UPDATE comments 
    SET commentableType = 'RunCase', commentableId = runCaseId 
    WHERE runCaseId IS NOT NULL
  `);

  // Make the new columns non-nullable
  await queryInterface.changeColumn('comments', 'commentableType', {
    type: Sequelize.STRING,
    allowNull: false,
  });

  await queryInterface.changeColumn('comments', 'commentableId', {
    type: Sequelize.INTEGER,
    allowNull: false,
  });

  // Add composite index for efficient polymorphic queries
  await queryInterface.addIndex('comments', ['commentableType', 'commentableId'], {
    name: 'comments_commentable_index',
  });

  // Remove the old runCaseId foreign key constraint and column
  await queryInterface.removeIndex('comments', ['runCaseId']);
  await queryInterface.removeColumn('comments', 'runCaseId');
}

export async function down(queryInterface, Sequelize) {
  // Re-add runCaseId column
  await queryInterface.addColumn('comments', 'runCaseId', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'runCases',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  // Migrate data back: only for RunCase type comments
  await queryInterface.sequelize.query(`
    UPDATE comments 
    SET runCaseId = commentableId 
    WHERE commentableType = 'RunCase'
  `);

  // Delete comments that are not RunCase type (shouldn't exist during rollback)
  await queryInterface.sequelize.query(`
    DELETE FROM comments 
    WHERE commentableType != 'RunCase'
  `);

  // Make runCaseId non-nullable
  await queryInterface.changeColumn('comments', 'runCaseId', {
    type: Sequelize.INTEGER,
    allowNull: false,
  });

  // Re-add the index
  await queryInterface.addIndex('comments', ['runCaseId']);

  // Remove polymorphic columns
  await queryInterface.removeIndex('comments', 'comments_commentable_index');
  await queryInterface.removeColumn('comments', 'commentableType');
  await queryInterface.removeColumn('comments', 'commentableId');
}
