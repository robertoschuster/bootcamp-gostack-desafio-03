import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import authConfig from '../../config/auth';

import User from '../models/User';

// Middleware de autenticação
// verifica se o usuário está autenticado através de um token jwt na requisição
export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Se o token não foi informado, retorna erro
  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  /**
   * Desestruturação
   * Como split retorna um array contento Bearer + token,
   * descarta a primeira parte
   */
  const [, token] = authHeader.split(' ');

  try {
    // Decodifica o token
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    if (!decoded.id) {
      return res.status(401).json({ error: 'No user provided in the token' });
    }
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ error: 'The user provided in the token was not found' });
    }

    // Inclui o id do usuário na própria requisição para ser acessado nas próximas funções
    req.userId = decoded.id;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};
