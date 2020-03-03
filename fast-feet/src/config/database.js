module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'pC4sG4t1cO9X',
  database: 'fastfeet',
  define: {
    // Todas as tabelas terão os campos created_at, updated_at
    timestamps: true,

    // Utiliza o formato user_groups em vez de UserGroups
    underscored: true,
    underscoredAll: true,
  },
};
