import * as Yup from 'yup';
// import { parseISO, isBefore } from 'date-fns';
import Delivery from '../models/Delivery';
import DeliveryProblem from '../models/DeliveryProblem';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
// import File from '../models/File';
import Mail from '../../lib/Mail';

class DeliveryProblemController {
  async index(req, res) {
    const { id } = req.params;

    // Filtro e Paginação
    const { page = 1, pageLimit = 10 } = req.query;

    const { docs, pages, total } = await DeliveryProblem.paginate({
      // where: id ? { id } : undefined,
      attributes: ['id', 'delivery_id', 'description'],
      page,
      paginate: pageLimit,
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'product',
            'canceled_at',
            'start_date',
            'end_date',
          ],
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
              required: true,
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name', 'email'],
              required: true,
            },
          ],
          where: id ? { id } : undefined,
          required: true,
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
      description: Yup.string()
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

    const { delivery_id } = req.params;
    const { description } = req.body;

    /**
     * Check foreign keys
     */
    const delivery = await Delivery.findByPk(delivery_id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    /**
     * Save
     */
    const problem = await DeliveryProblem.create({ delivery_id, description });

    /**
     * Return
     */
    return res.json(problem);
  }

  async delete(req, res) {
    const deliveryProblem = await DeliveryProblem.findByPk(req.params.id);
    if (!deliveryProblem) {
      return res.status(400).json({ error: 'Delivery problem not found.' });
    }

    const delivery = await Delivery.findByPk(deliveryProblem.delivery_id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'name'],
        },
      ],
    });

    await delivery.update({ canceled_at: new Date() });

    /**
     * Send mail
     */
    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}>`,
      subject: 'Encomenda cancelada',
      template: 'cancellation',
      context: {
        recipient: delivery.recipient.name,
        deliveryman: delivery.deliveryman.name,
        product: delivery.product,
        problem: deliveryProblem.description,
      },
    });

    return res.status(200).json();
  }
}

export default new DeliveryProblemController();
