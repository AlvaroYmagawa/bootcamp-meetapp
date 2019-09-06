/* eslint-disable class-methods-use-this */
import { isBefore } from 'date-fns';
import { Op } from 'sequelize';
import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Mail from '../../lib/Mail';

class SubscriptionController {
  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
      ],
    });

    // MEETUP ID VALIDATION
    if (!meetup) {
      return res.status(400).json({ error: 'meetup not found' });
    }

    // SUB IN YOUR OWN MEETUP VALIDATION
    if (meetup.provider_id === user.id) {
      return res
        .status(400)
        .json({ error: 'You cannot subscribe in your own meetup' });
    }

    // PAST MEETUP VALIDATION
    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({
        error: 'You cannot subscribe to meetups that already happened',
      });
    }

    const checkRepeated = await Subscription.findOne({
      where: {
        user_id: user.id,
        meetup_id: meetup.id,
      },
    });

    // ALREADY SUBSCRIBE VALIDATION
    if (checkRepeated) {
      return res
        .status(400)
        .json({ error: 'You already subscribe in this meetup' });
    }

    // CHECK MEETUP DATE AVAILABILITY
    const checkDate = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true, // inner join
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: 'This meetup date is not avaliable' });
    }

    // CREATE()
    const subscription = await Subscription.create({
      meetup_id: meetup.id,
      user_id: req.userId,
    });

    // SENDDING EMAIL FOR MEETUP PROVIDER
    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`, // name and email of user
      subject: 'Inscrição em sua MeetUp', // title of the mail
      template: 'subscription', // Template
      context: {
        provider: meetup.User.name,
        user: user.name,
      },
    });

    return res.json(meetup);
  }

  async index(req, res) {
    const subscribes = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });

    if (!subscribes) {
      return res
        .status(400)
        .json({ error: 'You are not subscribe in meetups' });
    }

    return res.json(subscribes);
  }
}

export default new SubscriptionController();
