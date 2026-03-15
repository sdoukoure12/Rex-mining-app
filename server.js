const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost/lightning-miner', { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Passport strategy
passport.use(new LocalStrategy(function (username, password, done) {
  User.findOne({ username: username }, function (err, user) {
    if (err) return done(err);
    if (!user) return done(null, false);
    bcrypt.compare(password, user.password, function(err, result) {
      if (result) return done(null, user);
      return done(null, false);
    });
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Routes
app.post('/register', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({
    username: req.body.username,
    password: hashedPassword,
    walletAddress: req.body.walletAddress,
  });
  await user.save();
  res.send('User registered');
});

app.post('/login', passport.authenticate('local', { successRedirect: '/mining-stats', failureRedirect: '/login' }));

app.get('/mining-stats', (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  // Fetch mining stats for the user
  res.send('Mining stats for user: ' + req.user.username);
});

app.post('/payment', (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  // Process payment logic here
  res.send('Payment processed for user: ' + req.user.username);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
