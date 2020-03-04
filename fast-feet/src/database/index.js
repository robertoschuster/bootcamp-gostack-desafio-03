import Sequelize from 'sequelize';
import databaseConfig from '../config/database';
import User from '../app/models/User';
import Recipient from '../app/models/Recipient';
import File from '../app/models/File';
import Deliveryman from '../app/models/Deliveryman';

// Array para registrar todos os models da aplicação
const models = [User, Recipient, File, Deliveryman];

class Database {
  constructor() {
    this.init();
  }

  init() {
    // Conecta com o banco
    this.connection = new Sequelize(databaseConfig);

    // Carrega (registra) todos os models
    models.map(model => model.init(this.connection));
  }
}

export default new Database();
