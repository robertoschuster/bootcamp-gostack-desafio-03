import * as Yup from 'yup';
import { Op } from 'sequelize';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    // Filtro e Paginação
    const { q, page = 1, pageLimit = 10 } = req.query;

    const { docs, pages, total } = await Deliveryman.paginate({
      where: {
        ...(q && { name: { [Op.iLike]: `%${q}%` } }),
      },
      attributes: ['id', 'name', 'email', 'avatar_id'],
      order: ['name', 'id'],
      page,
      paginate: pageLimit,
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    // Adds header
    res.setHeader('x-api-totalPages', pages || 0);
    res.setHeader('x-api-total', total || 0);
    return res.json(docs);
  }

  async store(req, res) {
    /**
     * Validação
     */
    const schema = Yup.object().shape({
      name: Yup.string()
        .max(255)
        .required(),
      email: Yup.string()
        .email()
        .required(),
    });
    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation failed.', errors: err.errors });
    }

    /**
     * Verifica se já existe
     */
    const exists = await Deliveryman.findOne({
      where: {
        [Op.or]: [{ name: req.body.name }, { email: req.body.email }],
      },
    });
    if (exists) {
      return res.status(400).json({ error: 'Deliveryman already exists.' });
    }

    /**
     * Cadastra
     */
    const { id, name, email } = await Deliveryman.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async update(req, res) {
    /**
     * Validação
     * (Utilizado o validate em vez do isValid para poder retornar os erros)
     */
    const schema = Yup.object().shape({
      name: Yup.string().max(255),
      email: Yup.string().email(),
      avatar_id: Yup.number()
        .positive()
        .integer(),
    });

    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation failed.', errors: err.errors });
    }

    /**
     * Verifica se o id existe
     */
    const deliveryman = await Deliveryman.findByPk(req.params.id);
    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    const { name, email, avatar_id } = req.body;

    /**
     * Se está mudando, verifica se já esxiste
     */
    if (name && name !== deliveryman.name) {
      const exists = await Deliveryman.findOne({ where: { name } });
      if (exists) {
        return res.status(400).json({ error: 'Name already exists.' });
      }
    }
    if (email && email !== deliveryman.email) {
      const exists = await Deliveryman.findOne({ where: { email } });
      if (exists) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
    }
    if (avatar_id) {
      const avatar = await File.findByPk(avatar_id);
      if (!avatar) {
        return res.status(400).json({ error: 'Avatar not found.' });
      }
    }

    /**
     * Update
     */
    await deliveryman.update(req.body);

    return res.status(200).json({
      id: deliveryman.id,
      name: deliveryman.name,
      email: deliveryman.email,
      avatar_id: deliveryman.avatar_id,
    });
  }

  async delete(req, res) {
    const deliveryman = await Deliveryman.findByPk(req.params.id);
    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    await deliveryman.destroy();
    return res.status(200).json();
  }
}

export default new DeliverymanController();
