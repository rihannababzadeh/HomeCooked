const express = require('express');
const app = express();
var path = require('path');
const port =3000;
const MongoClient = require('mongodb').MongoClient;
const mongodbURL = 'mongodb://localhost:27017';
const databaseName = 'project';
const usersCollection = 'users';
const foodsCollection = 'foods';
let search= '';
let username ='';
let food='';
let cooker='';
let authenticated;
const session = require('express-session');

app.use(session({
  secret: 'javascript learning session',
  resave: true,
  saveUninitialized: false
}));

const bcrypt = require('bcrypt');

const bodyParser = require('body-parser');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.set('view engine', 'pug');

app.get('/', (request, response) => {

    authenticated = request.session.authenticated || false;
    // { user: { authenticated: authenticated } }
    response.render('index',{ authenticated: authenticated, username: username});  
  });
  
app.get('/registration', (request, response) => {
   response.render('registration');
 });

 app.get('/persian', (request, response) => {
  response.render('persian');
});

app.get('/contact', (request, response) => {
  response.render('contact');
});

app.post('/registration', urlencodedParser, (request, response) => {
  console.log(request.body);
  const password = bcrypt.hashSync(request.body.password, 10);
  // We create a user
  const user = {
    username: request.body.username,
    email: request.body.email,
    // Use the hash instead of the plain password to store
    password: password
  }

  MongoClient.connect(mongodbURL, (error, client) => {
    const database = client.db(databaseName);
    const collection = database.collection(usersCollection);
  
    // We insert the user and redirect to home
    // You can add a unique Mongodb index to the username
    // Also we could search for the user before insert it to the db
    collection.insertOne(user, (error, result) => {
      response.redirect('/registration');
    });
  });
});

app.get('/foods', (request, response) => {
  response.render('foods',{ authenticated: authenticated, username: username});  
  // response.render('foods');
});
app.post('/login', urlencodedParser, (request, response) => {
  console.log(request.body);
  // We get the values from the POST request using body parser with request.body
  username = request.body.username;
  const password = request.body.password;

  // We need to find the user
  MongoClient.connect(mongodbURL, (error, client) => {
    const database = client.db(databaseName);
    const collection = database.collection(usersCollection);
  
    // We find the user by username as the password is a hash
    collection.find({username: username}).toArray((error, users) => {
      const user = users[0];
      
      // If we find a user and the password it's correct this statement will be true
      if (user && bcrypt.compareSync(password, user.password)) {
        // Set the authenticated session value to true
        request.session.authenticated = true;
        console.log(request.session.authenticated = true);

        // Redirect the user after login
        response.redirect('/');
      } else {
        // in case we don't have the user on our database or the password it's not correct we show an error
        response.render('nouser', { error: true });
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
  // app.post('/registration', urlencodedParser, (req, res) => {
  //   const username = req.body.username;
    
  //   console.log(req.body);
  
  //   res.send(`We got the following values from the query string: ${username}`);
  // });

app.use(express.static('public'));
// app.use('/static', express.static(path.join(__dirname, 'public')));

//
//
app.post('/search', urlencodedParser, (request, response) => {

    // We get the values from the POST request using body parser with request.body
  search = request.body.search;
  console.log(search);
  // We need to find the food
  MongoClient.connect(mongodbURL, (error, client) => {
    const database = client.db(databaseName);
    const foods = database.collection(foodsCollection);

    foods.find({"name": search}).toArray((error, name) => {
      food = name[0];    
      if (food) {
        cooker = food.cooker;
        image = food.image;
        food = food.name;
        console.log(image);

        response.redirect('/results');
      } else {
        let noresult = " no result!";
        response.render('foods', { error: true, noresult: noresult, authenticated: authenticated, username: username });
      }
    });
  });
});
app.get('/results', (request, response) => {
  response.render('results',{ food:food, cooker: cooker,image:image, authenticated: authenticated, username: username});  
});


//
app.listen(port, function() {
    console.log('Listening on port 3000!');
  });