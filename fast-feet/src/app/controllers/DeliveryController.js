import * as Yup from 'yup';
import {
  parseISO,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
  setSeconds,
} from 'date-fns';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File from '../models/File';
import Mail from '../../lib/Mail';

class DeliveryController {
  async index(req, res) {
    const deliveries = await Delivery.findAll({
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
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
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    res.json(deliveries);
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
     * Check alowed times for deliveries (from 08:00 to 18:00)
     */
    if (start_date) {
      const startDate = parseISO(start_date);
      const startHour = setSeconds(
        setMinutes(setHours(new Date(start_date), 8), 0),
        0
      );
      const endHour = setSeconds(
        setMinutes(setHours(new Date(start_date), 18), 0),
        0
      );

      const refused =
        isBefore(startDate, startHour) || isAfter(startDate, endHour);

      if (refused) {
        return res
          .status(400)
          .json({ error: 'Start date must be between 08:00 and 18:00.' });
      }
    }

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
