module.exports = {
  dialect: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  define: {
    // Todas as tabelas terão os campos created_at, updated_at
    timestamps: true,

    // Utiliza o formato user_groups em vez de UserGroups
    underscored: true,
    underscoredAll: true,
  },
};
