const express = require('express');
const app = express();
const port = 3000;
const MongoClient = require('mongodb').MongoClient;
const mongodbURL = 'mongodb://localhost:27017';
const databaseName = 'demo';
const collectionName = 'users';

// Require express session to create and handle our server session
const session = require('express-session');

app.use(session({
  secret: 'javascript learning session',
  resave: true,
  saveUninitialized: false
}));

// We add this module to create a passwod hash to avoid storing the password in plain text
const bcrypt = require('bcrypt');

// Require Body Parser so we can get values from POST requests
const bodyParser = require('body-parser');

// Configure body parser to parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.set('view engine', 'pug');

app.get('/', (request, response) => {
  const authenticated = request.session.authenticated || false;

  response.render('index', { user: { authenticated: authenticated } });
});

app.get('/signup', (request, response) => {
  response.render('signup');
});

// As we configured Body Parser now we get POST values on request.body
app.post('/signup', (request, response) => {
  // Use bcrypt module to create a password hash
  const password = bcrypt.hashSync(request.body.password, 10);

  // We create a user
  const user = {
    name: request.body.name,
    username: request.body.username,
    // Use the hash instead of the plain password to store
    password: password
  }

  MongoClient.connect(mongodbURL, (error, client) => {
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
  
    // We insert the user and redirect to home
    // You can add a unique Mongodb index to the username
    // Also we could search for the user before insert it to the db
    collection.insertOne(user, (error, result) => {
      response.redirect('/');
    });
  });
});

app.get('/login', (request, response) => {
  response.render('login');
});

app.post('/login', (request, response) => {
  // We get the values from the POST request using body parser with request.body
  const username = request.body.username;
  const password = request.body.password;

  // We need to find the user
  MongoClient.connect(mongodbURL, (error, client) => {
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
  
    // We find the user by username as the password is a hash
    collection.find({username: username}).toArray((error, users) => {
      const user = users[0];
      
      // If we find a user and the password it's correct this statement will be true
      if (user && bcrypt.compareSync(password, user.password)) {
        // Set the authenticated session value to true
        request.session.authenticated = true;

        // Redirect the user after login
        response.redirect('/');
      } else {
        // in case we don't have the user on our database or the password it's not correct we show an error
        response.render('login', { error: true });
      }
    });
  });
});

// GET /logout
app.get('/logout', (request, response, next) => {
  if (request.session) {
    // delete session object
    request.session.destroy((error) => {
      if (error) {
        // We can congigure an error handler
        return next(err);
      } else {
        // Redirect the user after logout
        return response.redirect('/');
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});