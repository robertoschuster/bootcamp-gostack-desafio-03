import multer from 'multer';
import crypto from 'crypto';
import { resolve, extname } from 'path';

export default {
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, res) => {
        if (err) return cb(err);

        // Exemplo: dskjhfskjhfjdskl.png
        return cb(null, res.toString('hex') + extname(file.originalname));
      });
    },
  }),
};
