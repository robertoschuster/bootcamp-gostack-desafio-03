import * as Yup from 'yup';
import { Op } from 'sequelize';
import Recipient from '../models/Recipient';

class RecipientController {
  async index(req, res) {
    // Filtro e Paginação
    const { q, page = 1, pageLimit = 10 } = req.query;

    const { docs, pages, total } = await Recipient.paginate({
      where: {
        ...(q && { name: { [Op.iLike]: `%${q}%` } }),
      },
      attributes: [
        'id',
        'name',
        'street',
        'number',
        'compl',
        'state',
        'city',
        'zip_code',
      ],
      order: ['name', 'id'],
      page,
      paginate: pageLimit,
    });
    // Adds header
    res.setHeader('x-api-totalPages', pages || 0);
    res.setHeader('x-api-total', total || 0);
    res.json(docs);
  }

  async store(req, res) {
    /**
     * Validação
     * (Utilizado o validate em vez do isValid para poder retornar os erros)
     */
    const schema = Yup.object().shape({
      name: Yup.string()
        .max(255)
        .required(),
      street: Yup.string().max(255),
      number: Yup.string().max(255),
      compl: Yup.string().max(255),
      state: Yup.string().max(2),
      city: Yup.string().max(255),
      zip_code: Yup.string().max(255),
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
    const exists = await Recipient.findOne({ where: { name: req.body.name } });
    if (exists) {
      return res.status(400).json({ error: 'Recipient already exists.' });
    }

    /**
     * Cadastra
     */
    const {
      id,
      name,
      street,
      number,
      compl,
      state,
      city,
      zip_code,
    } = await Recipient.create(req.body);

    return res.json({
      id,
      name,
      street,
      number,
      compl,
      state,
      city,
      zip_code,
    });
  }

  async update(req, res) {
    /**
     * Validação
     * (Utilizado o validate em vez do isValid para poder retornar os erros)
     */
    const schema = Yup.object().shape({
      name: Yup.string().max(255),
      street: Yup.string().max(255),
      number: Yup.string().max(255),
      compl: Yup.string().max(255),
      state: Yup.string().max(2),
      city: Yup.string().max(255),
      zip_code: Yup.string().max(255),
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
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient not found.' });
    }

    const { name } = req.body;

    /**
     * Verifica se o nome já existe
     */
    if (name && name !== recipient.name) {
      const exists = await Recipient.findOne({ where: { name } });
      if (exists) {
        return res.status(400).json({ error: 'Recipient already exists.' });
      }
    }

    /**
     * Update
     */
    const {
      id,
      street,
      number,
      compl,
      state,
      city,
      zip_code,
    } = await recipient.update(req.body);

    return res.status(200).json({
      id,
      name,
      street,
      number,
      compl,
      state,
      city,
      zip_code,
    });
  }
}

export default new RecipientController();
