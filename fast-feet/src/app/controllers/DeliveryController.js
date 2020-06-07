import * as Yup from 'yup';
import { Op } from 'sequelize';
import { parseISO, isBefore } from 'date-fns';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File from '../models/File';
import Mail from '../../lib/Mail';

class DeliveryController {
  async index(req, res) {
    // Filtro e Paginação
    const { q, page = 1, pageLimit = 10 } = req.query;

    const { docs, pages, total } = await Delivery.paginate({
      where: {
        ...(q && { product: { [Op.iLike]: `%${q}%` } }),
      },
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      order: [['id', 'DESC']],
      page,
      paginate: pageLimit,
      // limit: pageLimit,
      // offset: (page - 1) * pageLimit,
      include: [
        {
          model: Recipient,
          as: 'recipient',
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
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        },
        {
          model: File,
          as: 'signature',
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
     * Validate input params
     */
    const schema = Yup.object().shape({
      recipient_id: Yup.number()
        .positive()
        .integer(),
      deliveryman_id: Yup.number()
        .positive()
        .integer(),
      product: Yup.string()
        .max(255)
        .required(),
    });
    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation failed.', errors: err.errors });
    }

    const { recipient_id, deliveryman_id, product } = req.body;

    /**
     * Check foreign keys
     */
    const recipient = await Recipient.findByPk(recipient_id);
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient not found.' });
    }
    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    /**
     * Save
     */
    const { id } = await Delivery.create({
      recipient_id,
      deliveryman_id,
      product,
    });

    /**
     * Send mail
     */
    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: 'Nova encomenda para entraga',
      template: 'creation',
      context: {
        recipient: recipient.name,
        deliveryman: deliveryman.name,
        product,
      },
    });

    /**
     * Return
     */
    return res.json({
      id,
      recipient_id,
      deliveryman_id,
      product,
    });
  }

  async update(req, res) {
    /**
     * Validate input params
     */
    const schema = Yup.object().shape({
      recipient_id: Yup.number()
        .positive()
        .integer(),
      deliveryman_id: Yup.number()
        .positive()
        .integer(),
      product: Yup.string().max(255),
      canceled_at: Yup.date(),
      start_date: Yup.date(),
      end_date: Yup.date(),
    });
    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation failed.', errors: err.errors });
    }

    const { recipient_id, deliveryman_id, signature_id } = req.body;

    /**
     * Check foreign keys
     */
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }
    if (recipient_id) {
      const recipient = await Recipient.findByPk(recipient_id);
      if (!recipient) {
        return res.status(400).json({ error: 'Recipient not found.' });
      }
    }
    if (deliveryman_id) {
      const deliveryman = await Deliveryman.findByPk(deliveryman_id);
      if (!deliveryman) {
        return res.status(400).json({ error: 'Deliveryman not found.' });
      }
    }
    if (signature_id) {
      const signature = await File.findByPk(signature_id);
      if (!signature) {
        return res.status(400).json({ error: 'Signature not found.' });
      }
    }

    const { product, canceled_at, start_date, end_date } = req.body;

    /**
     * Check end_date
     */
    if (end_date) {
      const endDate = parseISO(end_date);

      let refused = false;

      refused =
        (!delivery.start_date && !start_date) ||
        (start_date && isBefore(endDate, parseISO(start_date))) ||
        (delivery.start_date &&
          !start_date &&
          isBefore(endDate, delivery.start_date));

      if (refused) {
        return res
          .status(400)
          .json({ error: 'End date must be after Start date.' });
      }
    }

    /**
     * Update
     */
    const { id } = await delivery.update(req.body);

    /**
     * Return
     */
    return res.status(200).json({
      id,
      recipient_id,
      deliveryman_id,
      signature_id,
      product,
      canceled_at,
      start_date,
      end_date,
    });
  }

  async delete(req, res) {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    await delivery.update({ canceled_at: new Date() });
    return res.status(200).json();
  }
}

export default new DeliveryController();
