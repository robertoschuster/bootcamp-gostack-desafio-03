import Sequelize from 'sequelize';
import databaseConfig from '../config/database';
import User from '../app/models/User';
import Recipient from '../app/models/Recipient';
import Deliveryman from '../app/models/Deliveryman';
import Delivery from '../app/models/Delivery';
import DeliveryProblem from '../app/models/DeliveryProblem';
import File from '../app/models/File';

// Array para registrar todos os models da aplicação
const models = [User, Recipient, Deliveryman, Delivery, DeliveryProblem, File];

class Database {
  constructor() {
    this.init();
  }

  init() {
    // Conecta com o banco
    this.connection = new Sequelize(databaseConfig);

    // Carrega (registra) todos os models
    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
