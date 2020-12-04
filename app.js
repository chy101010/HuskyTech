const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const employeeRouter = require('./routes/employees');
const apiRouter = require('./routes/api');
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/u-home', usersRouter);
app.use('/e-home', employeeRouter);
app.use('/api', apiRouter);

// set a cookie
app.use(function (req, res, next) {
  // check if client sent cookie
  const cookie = req.cookies.cookieName;
  if (cookie === undefined) {
    res.redirect('/login')
  } else {
    // yes, cookie was already present 
    console.log('cookie exists', cookie);
  } 
  next(); // <-- important!
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
