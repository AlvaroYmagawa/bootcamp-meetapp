/* eslint-disable class-methods-use-this */
import jwt from 'jsonwebtoken';

import dBConfig from '../../config/auth';

import User from '../models/User';

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' });
    }
    const { id, name } = user;

    return res.json({
      id,
      name,
      email,
      token: jwt.sign({ id }, dBConfig.secret, {
        expiresIn: dBConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
