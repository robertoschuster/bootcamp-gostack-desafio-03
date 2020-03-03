import * as Yup from 'yup';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    /**
     * Validação dos campos de entrada
     */
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    // if (!(await schema.isValid(req.body))) {
    //   return res.status(400).json({ error: 'Validation failed.' });
    // }
    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation failed.', errors: err.errors });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    // Verifica se o email existe
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Verifica se a senha está correta
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name } = user;

    // Retorna o usuário + um token JWT
    return res.json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
