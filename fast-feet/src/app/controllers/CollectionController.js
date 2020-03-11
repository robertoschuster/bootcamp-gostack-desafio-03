import {
  isAfter,
  setHours,
  setMinutes,
  setSeconds,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class CollectionController {
  async store(req, res) {
    const { id } = req.params;

    /**
     * Check foreign keys
     */
    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    const start_date = new Date();
    const { deliveryman_id } = delivery;

    /**
     * Check alowed times for collect (from 08:00 to 18:00)
     */
    if (start_date) {
      const startHour = setSeconds(
        setMinutes(setHours(new Date(start_date), 8), 0),
        0
      );
      const endHour = setSeconds(
        setMinutes(setHours(new Date(start_date), 19), 0),
        0
      );

      const refused =
        isBefore(start_date, startHour) || isAfter(start_date, endHour);

      if (refused) {
        return res
          .status(400)
          .json({ error: 'Start date must be between 08:00 and 18:00.' });
      }
    }

    /**
     * Check daily delivery limit
     */
    const dailyDeliveries = await Delivery.findAll({
      where: {
        deliveryman_id,
        start_date: {
          [Op.between]: [startOfDay(start_date), endOfDay(start_date)],
        },
        canceled_at: null,
      },
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    if (dailyDeliveries && dailyDeliveries.length >= 5) {
      return res
        .status(400)
        .json({ error: 'You can make only 5 deliveries / day.' });
    }

    /**
     * Save
     */
    await delivery.update({ start_date });

    /**
     * Return
     */
    return res.json({ delivery });
  }

  async update(req, res) {
    const { id } = req.params;
    const end_date = new Date();

    /**
     * Check foreign keys
     */
    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    /**
     * Check endDate
     */
    const refused =
      !delivery.start_date ||
      (delivery.start_date && isBefore(end_date, delivery.start_date));

    if (refused) {
      return res
        .status(400)
        .json({ error: 'End date must be after Start date.' });
    }

    /**
     * Check is signature was sent
     */
    if (!req.file) {
      return res.status(400).json({ error: 'Signature not sent.' });
    }

    /**
     * Save the signature
     */
    const { id: signature_id } = await File.create({
      name: req.file.originalname,
      path: req.file.filename,
    });

    /**
     * Save
     */
    await delivery.update({ end_date, signature_id });

    /**
     * Return
     */
    return res.json({ delivery });
  }
}

export default new CollectionController();
