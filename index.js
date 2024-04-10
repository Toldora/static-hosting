const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const casinosRoutes = require('./routes/casinos');

const PORT = process.env.PORT || 3030;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', casinosRoutes);

async function init() {
  try {
    await mongoose.connect(
      'mongodb+srv://kropivnyi:toldora21@cluster0.qppwslg.mongodb.net/casinos',
      {
        useNewUrlParser: true,
      },
    );
    app.listen(PORT, () => {
      console.log('Server has been started...');
    });
  } catch (e) {
    console.log(e);
  }
}

init();

module.exports = app;
