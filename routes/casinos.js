/* eslint-disable no-underscore-dangle */
const { Router } = require('express');
const { check, validationResult } = require('express-validator');
const XLSX = require('xlsx');
const stream = require('stream');
const User = require('../models/User');
const Casino = require('../models/Casino');

const router = Router();

const validationMiddleware = [check('email', 'Invalid email').isEmail()];

router.get('/', async (req, res) => {
  res.json({ message: 'Hi!' });
});

router.post('/sign-up', validationMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Validation error',
      });
    }

    const { email, name, browserId, ip } = req.body;

    let casino = await Casino.findOne({ name });
    if (!casino) {
      casino = new Casino({
        name,
      });
      await casino.save();
    }

    const user = await User.findOne({
      registeredOn: casino._id,
      $or: [{ email }, { browserId }],
    });
    if (user) {
      const response =
        user.email === email
          ? {
              message: 'This email has already been registered',
              messagePt: 'Esse email já foi cadastrado',
            }
          : {
              message: 'this device has already been registered',
              messagePt: 'Este dispositivo já foi registrado',
            };
      return res.status(400).json(response);
    }
    const newUser = new User({
      email,
      ip,
      browserId,
      registeredOn: casino._id,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error, message: 'Something went wrong' });
  }
});

router.get('/excel', async (req, res) => {
  try {
    const casinos = await Casino.find();
    const users = await User.find();
    const normalizedUsers = users.map(
      ({ email, ip, browserId, registeredOn, _id }) => {
        const casino = casinos.find(
          casino => casino._id.toJSON() === registeredOn.toJSON(),
        );
        const registrationDate = _id.getTimestamp();
        return {
          casino: casino.name,
          email,
          registrationDate,
          ip,
          browserId,
        };
      },
    );

    const groupedUsers = normalizedUsers.reduce(function (r, a) {
      r[a.casino] = r[a.casino] || [];
      r[a.casino].push(a);
      return r;
    }, {});

    const entries = Object.entries(groupedUsers);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);

    let counter = 1;
    entries.forEach(([_, users], index) => {
      XLSX.utils.sheet_add_json(ws, users, {
        skipHeader: Boolean(index),
        origin: { c: 0, r: Boolean(index) ? counter : 0 },
      });

      counter += users.length;
    });

    XLSX.utils.book_append_sheet(wb, ws);
    const buffer = XLSX.write(wb, {
      type: 'buffer',
    });
    const readStream = new stream.PassThrough();
    readStream.end(buffer);

    res.setHeader(
      'Content-disposition',
      'attachment; filename=' + 'Report.xlsx',
    );
    res.setHeader(
      'Content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    readStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
      message: 'Something went wrong',
    });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const casinos = await Casino.find();
    const users = await User.find();
    const result = users.reduce((acc, user) => {
      const casino = casinos.find(
        casino => casino._id.toJSON() === user.registeredOn.toJSON(),
      );
      if (acc[casino.name]) {
        acc[casino.name] = acc[casino.name] + 1;
      } else {
        acc[casino.name] = 1;
      }
      return acc;
    }, {});
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error, message: 'Something went wrong' });
  }
});

router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const casino = await Casino.findOne({ name });
    const users = await User.find({ registeredOn: casino._id });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error, message: 'Something went wrong' });
  }
});

module.exports = router;
