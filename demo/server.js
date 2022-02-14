const path = require('path');
const express = require('express');
const layout = require('express-layout');
const bodyParser = require('body-parser');
const validator = require('express-validator');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');

const routes = require('./routes');
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const middlewares = [
  layout(),
  express.static(path.join(__dirname, 'public')),
  bodyParser.urlencoded(),
  cookieParser('super-secret-key'),
  session({ cookie: { maxAge: 60000 } }),
  csrf({ cookie: true }),
  validator({ extended: false }),
];
app.use(middlewares);

app.use('/', routes);

app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log(`App running at http://localhost:3000`);
});
