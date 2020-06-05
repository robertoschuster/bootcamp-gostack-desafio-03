import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File from '../models/File';

class MyDeliveryController {
  async index(req, res) {
    const { deliveryman_id } = req.params;

    // Filtro e Paginação
    const { q, page = 1, pageLimit = 10 } = req.query;

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    const { delivered } = req.query;
    const end_date = delivered ? { [Op.ne]: null } : null;

    const { docs, pages, total } = await Delivery.paginate({
      where: {
        deliveryman_id,
        end_date,
        canceled_at: null,
        ...(q && { product: { [Op.iLike]: `%${q}%` } }),
      },
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      page,
      paginate: pageLimit,
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

    // Adds header
    res.setHeader('x-api-totalPages', pages || 0);
    res.setHeader('x-api-total', total || 0);
    return res.json(docs);
  }
}

export default new MyDeliveryController();
