const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3030;
const HOST = process.env.HOST || '127.0.0.1';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}/assets`));

function init() {
  app.listen(PORT, HOST, function () {
    console.log(`Server listens http://${HOST}:${PORT}`);
  });
}

init();

module.exports = app;
