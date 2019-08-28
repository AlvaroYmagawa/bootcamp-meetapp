/* eslint-disable no-shadow */
/* eslint-disable class-methods-use-this */
import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  // STORE
  async store(req, res) {
    // BODY REQUEST VALIDATION
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
      confirmPassword: Yup.string()
        .required()
        .oneOf([Yup.ref('password')]),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    // EMAIL VALIDATION
    const emailExists = await User.findOne({
      where: { email: req.body.email },
    });

    if (emailExists) {
      return res.status(400).json({ error: 'email already exists' });
    }

    // STORE USER
    const user = await User.create(req.body);
    return res.json(user);
  }

  // UPDATE
  async update(req, res) {
    const user = await User.findByPk(req.userId);

    const { email, oldPassword } = req.body;

    // BODY REQUEST VALIDATION
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) => {
          return oldPassword ? field.required() : field;
        }),
      confirmPassword: Yup.string().when('password', (password, field) => {
        return password ? field.required().oneOf([Yup.ref('password')]) : field;
      }),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    // MAIL VALIDATION
    if (email !== user.email) {
      const emailExists = await User.findOne({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: 'email already exists' });
      }
    }

    // PASSWORD VALIDATION
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(400).json({ error: 'password does not match' });
    }

    // UPDATE USER
    const { id, name } = await user.update(req.body);

    return res.json({ id, name, email });
  }
}

export default new UserController();
