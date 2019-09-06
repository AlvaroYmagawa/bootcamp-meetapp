/* eslint-disable class-methods-use-this */
import {
  parseISO,
  startOfHour,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import * as Yup from 'yup';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      localization: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { title, description, localization, date, banner_id } = req.body;
    const hourStart = startOfHour(parseISO(date));

    // PAST DATE VALIDATION
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past date are not permitted' });
    }

    // CHECK DATE AVAILABILITY
    const checkAvailability = await Meetup.findOne({
      where: {
        provider_id: req.userId,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res.status(400).json({ error: 'Meetup date is not available' });
    }

    const meetup = await Meetup.create({
      title,
      description,
      localization,
      date,
      banner_id,
      provider_id: req.userId,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      localization: Yup.string(),
      date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.provider_id !== req.userId) {
      return res
        .status(400)
        .json({ error: 'You are not allowed to change this meetup' });
    }

    const {
      title,
      description,
      localization,
      date,
      banner_id,
    } = await meetup.update(req.body);

    return res.json({
      id,
      title,
      description,
      localization,
      date,
      banner_id,
    });
  }

  async index(req, res) {
    const { page, date } = req.query;
    const parseDate = parseISO(date);

    const meetups = await Meetup.findAll({
      where: {
        date: { [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)] },
      },
      limit: 10,
      offset: (page - 1) * 10,
    });
    return res.json(meetups);
  }

  async delete(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.provider_id !== req.userId) {
      return res
        .status(400)
        .json({ error: 'You are not allowed to change this meetup' });
    }

    return res.json();
  }
}

export default new MeetupController();
