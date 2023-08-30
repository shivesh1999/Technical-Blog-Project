// Intialize Express
const express = require('express');
const app = express();
var methodoverride = require('method-override');
app.use(methodoverride('_method'));

// Set up views folder for static content
const path = require('path');
app.set('views', path.join(__dirname, 'views'));

// Setting the view engine
app.set('view engine', 'ejs');

// Serve static assets from /assets route
app.use('/assets', express.static('assets'));

// Importing required models
const User = require('./models/user');
const Post = require('./models/posts');
const comments = require('./models/comments');

// Database connection using Mongoose
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/auth', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Database Connected");
});

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Required modules
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');

// Set up session and flash messages
app.use(session({
  secret: 'user feeds',
  saveUninitialized: true,
  resave: true
}));
app.use(flash());
app.use((req, res, next) => {
  // Make flash messages available in templates
  res.locals.success = req.flash('success');
  next();
});

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  next();
};

// Start the server
app.listen(8080, () => {
  console.log("Port 8080 : Activated");
});

// Route to render the home page
app.get('/', async (req, res) => {
  const posts = await Post.find({});
  req.flash('notify', 'Success!!');
  res.render('index.ejs', { post: posts });
});

// Route to render the login page
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

// Route to handle user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
      // Store user information in session
      req.session.user_id = user._id;
      req.session.firstname = user.firstname;
      // ... (other user data)
      res.redirect('/feeds');
    } else {
      req.flash('success', 'Invalid username or password.');
      res.redirect('/login');
    }
  } catch (err) {
    req.flash('success', 'Invalid username or password.');
    res.redirect('/login');
  }
});

// Route to render the signup page
app.get('/signup', (req, res) => {
  res.render('signup.ejs');
});

// Route to handle user signup
app.post('/signup', async (req, res) => {
  const { firstname, lastname, email, password, day, month, year, gender } = req.body;
  // Hash the password before saving to the database
  const hash = await bcrypt.hash(password, 12);
  const user = new User({
    firstname,
    lastname,
    email,
    password: hash,
    day,
    month,
    year,
    gender
  });
  await user.save();
  req.flash('success', 'Successfully created your Account.');
  res.redirect('/login');
});

// Route to render user's feeds page
app.get('/feeds', requireLogin, async (req, res) => {
  const posts = await Post.find({});
  res.render('feeds.ejs', { name: req.session.firstname, post: posts });
});

// Route to log out user
app.get('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/');
});

// Route to handle post submission
app.post('/post', requireLogin, async (req, res) => {
  const { topic, content } = req.body;
  const Id = req.session.user_id;
  const Name = req.session.firstname;
  const post = new Post({
    topic,
    content,
    name: Name,
    userid: Id
  });
  await post.save();
  req.flash('success', 'Post Successful');
  res.redirect('/feeds');
});

// Route to render user's profile page
app.get('/profile', requireLogin, async (req, res) => {
  const id = req.session.user_id;
  const currentuser = await User.find({ email: req.session.email });
  const posts = await Post.find({ userid: id });
  res.render('profile.ejs', { name: req.session.firstname, post: posts, user: currentuser });
});

// Route to delete a user's post
app.delete('/profile/:id', async (req, res) => {
  const { id } = req.params;
  const deletedProduct = await Post.findByIdAndDelete(id);
  res.redirect('/profile');
});

// Route to render post editing page
app.get('/profile/:id/edit', async (req, res) => {
  const { id } = req.params;
  const reqpost = await Post.findById(id);
  res.render('edit.ejs', { post: reqpost });
});

// Route to handle post editing
app.put('/profile/:id/edit', async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByIdAndUpdate(id, req.body);
  res.redirect('/profile');
});

// Route to render a specific post's page
app.get('/post/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  const allcomments = await comments.find({ postid: id });
  res.render('post.ejs', { name: req.session.firstname, post: post, comments: allcomments });
});

// Routes to handle upvoting and downvoting a post
app.get('/post/:id/upvote', requireLogin, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByIdAndUpdate(id, { $inc: { upvote: 1 } });
  await post.save();
  const allcomments = await comments.find({ postid: id });
  res.render('post.ejs', { name: req.session.firstname, post: post, comments: allcomments });
});

app.get('/post/:id/downvote', requireLogin, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByIdAndUpdate(id, { $inc: { downvote: 1 } });
  await post.save();
  const allcomments = await comments.find({ postid: id });
  res.render('post.ejs', { name: req.session.firstname, post: post, comments: allcomments });
});

// Route to add a comment to a post
app.post('/post/:id/comment', requireLogin, async (req, res) => {
  const { comment } = req.body;
  const { id } = req.params;
  const userid = req.session.user_id;
  const postid = id;
  const name = req.session.firstname;
  const newcomment = new comments({
    userid,
    postid,
    comment,
    name
  });
  await newcomment.save();
  const post = await Post.findById(id);
  const allcomments = await comments.find({ postid: id });
  res.render('post.ejs', { name: req.session.firstname, post: post, comments: allcomments });
});

// Route to render user's about page
app.get('/profile/about', requireLogin, async (req, res) => {
  res.render('about.ejs', {
    name: req.session.fullname,
    dateofbirth: req.session.dateofbirth,
    gender: req.session.gender,
    email: req.session.email
  });
});
