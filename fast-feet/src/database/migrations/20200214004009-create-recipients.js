module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('recipients', {
      id: {
        type: Sequelize.INTEGER,
        alowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      street: Sequelize.STRING,
      number: Sequelize.STRING,
      compl: Sequelize.STRING,
      state: Sequelize.STRING,
      city: Sequelize.STRING,
      zip_code: Sequelize.STRING,

      // Timestamps
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  down: queryInterface => {
    return queryInterface.dropTable('recipients');
  },
};
