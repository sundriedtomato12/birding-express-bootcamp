import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import { format } from 'date-fns';

// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'postgres',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

const app = express();
// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Override POST requests with query param ?_method=PUT to be PUT requests
// This registers ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

let sqlQuery = '';

// GET function to get home page with list of notes
app.get('/', (request, response) => {
  console.log('request came in to get home page with list of notes');
  sqlQuery = 'SELECT * from notes';
  const loginResult = [];
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }

    if (result.rows.length <= 0) {
      console.log('No results!');
    } else {
      console.log(result.rows);
    }
    const data = result.rows;
    for (let i = 0; i < data.length; i += 1) {
      const newDate = format(new Date(data[i].observation_date), 'dd MMM yyyy');
      data[i].observation_date = newDate;
    }
    console.log(data);
    console.log('Is user logged in?');
    console.log(request.cookies.loggedIn);
    if (request.cookies.loggedIn) {
      loginResult.push('logged in');
    } else {
      loginResult.push('logged out');
    }
    console.log(loginResult);
    response.render('homepage', { data, loginResult });
  });
});

// GET function to get page to create new note
app.get('/note', (request, response) => {
  console.log('request came in to get form to create new note');
  const loginResult = [];
  if (request.cookies.loggedIn) {
    loginResult.push('logged in');
  } else {
    loginResult.push('logged out');
  }
  response.render('createnote', { loginResult });
});

// POST function post new note details into notes table
app.post('/note', (request, response) => {
  console.log('accept post request to create new note');
  const loginResult = [];
  sqlQuery = 'INSERT INTO notes (observation_date, behaviour, flock_size) VALUES ($1, $2, $3)';
  const { observation_date, behaviour, flock_size } = request.body;
  const inputData = [observation_date, behaviour, flock_size];

  pool.query(sqlQuery, inputData, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log('Successfully executed query');
    if (request.cookies.loggedIn) {
      loginResult.push('logged in');
    } else {
      loginResult.push('logged out');
    }
    response.render('notecreated', { loginResult });
  });
});

// GET function to get page of note by id
app.get('/note/:id', (request, response) => {
  console.log('request came in to get page of note id:');
  console.log(request.params.id);
  const loginResult = [];
  const id = [request.params.id];
  sqlQuery = 'SELECT * FROM notes WHERE id = $1';
  pool.query(sqlQuery, id, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }

    if (result.rows.length <= 0) {
      console.log('No such id!');
    } else {
      console.log(result.rows);
    }
    const data = result.rows[0];
    const newDate = format(new Date(data.observation_date), 'dd MMM yyyy');
    data.observation_date = newDate;
    if (request.cookies.loggedIn) {
      loginResult.push('logged in');
    } else {
      loginResult.push('logged out');
    }
    response.render('viewnote', { data, loginResult });
  });
});

// GET function to get page to edit note by id
app.get('/note/:id/edit', (request, response) => {
  console.log('request came in to get page to edit note id:');
  console.log(request.params.id);
  const loginResult = [];
  const id = [request.params.id];
  sqlQuery = 'SELECT * FROM notes WHERE id = $1';
  pool.query(sqlQuery, id, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }

    if (result.rows.length <= 0) {
      console.log('No such id!');
    } else {
      const data = result.rows[0];
      const newDate = format(new Date(data.observation_date), 'yyyy-MM-dd');
      data.observation_date = newDate;
      console.log(data);
      if (request.cookies.loggedIn) {
        loginResult.push('logged in');
      } else {
        loginResult.push('logged out');
      }
      response.render('editnote', { data, loginResult });
    }
  });
});

// PUT function to edit note by id
app.put('/note/:id/', (request, response) => {
  console.log('request came in to edit note id:');
  console.log(request.params.id);
  const loginResult = [];
  const { observation_date, behaviour, flock_size } = request.body;
  const inputData = [request.params.id, observation_date, behaviour, flock_size];

  sqlQuery = 'UPDATE notes SET observation_date = $2, behaviour = $3, flock_size = $4 WHERE id = $1';

  console.log('input data');
  console.log(inputData);

  pool.query(sqlQuery, inputData, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log('note edited!');
    if (request.cookies.loggedIn) {
      loginResult.push('logged in');
    } else {
      loginResult.push('logged out');
    }
    response.render('noteedited', { loginResult });
  });
});

// DELETE function to delete note by id
app.delete('/note/:id', (request, response) => {
  console.log('request came in to delete note id:');
  console.log(request.params.id);
  const loginResult = [];
  const id = [request.params.id];
  sqlQuery = 'DELETE FROM notes WHERE id=$1';

  pool.query(sqlQuery, id, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log('delete successful');
    if (request.cookies.loggedIn) {
      loginResult.push('logged in');
    } else {
      loginResult.push('logged out');
    }
    response.render('notedeleted', { loginResult });
  });
});

// GET function to get page to sign up new user
app.get('/signup', (request, response) => {
  console.log('request came in to sign up as a new user');
  const loginResult = [];
  if (request.cookies.loggedIn) {
    loginResult.push('logged in');
  } else {
    loginResult.push('logged out');
  }
  response.render('signup', { loginResult });
});

// POST function to create new user
app.post('/signup', (request, response) => {
  console.log('accept post request to sign up new user');
  sqlQuery = 'INSERT INTO users (email, password) VALUES ($1, $2)';
  const loginResult = [];
  const { email, password } = request.body;
  const inputData = [email, password];

  pool.query(sqlQuery, inputData, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }
    console.log('Successfully added new user to database');
    if (request.cookies.loggedIn) {
      loginResult.push('logged in');
    } else {
      loginResult.push('logged out');
    }
    response.render('signupsuccessful', { loginResult });
  });
});

// GET function to get page for user to input login credentials
app.get('/login', (request, response) => {
  console.log('request came in for user to login');
  const loginResult = [];
  if (request.cookies.loggedIn === true) {
    loginResult.push('logged in');
  } else {
    loginResult.push('logged out');
  }
  console.log(loginResult);
  response.render('login', { loginResult });
});

// POST function to accept user's request to log in
app.post('/login', (request, response) => {
  console.log('accept post request to log user in');
  const loginResult = [];
  const inputData = [request.body.email];

  sqlQuery = 'SELECT * FROM users WHERE email=$1';

  pool.query(sqlQuery, inputData, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send('sorry! there was an error!');
      return;
    }

    if (result.rows.length === 0) {
      // we didnt find a user with that email.
      // the error for password and user are the same
      // don't tell the user which error they got for security reasons,
      // otherwise people can guess if a person is a user of a given service.
      response.status(403).send('sorry!');
      return;
    }

    const user = result.rows[0];
    console.log(user);

    if (user.password === request.body.password) {
      response.cookie('loggedIn', true);
      response.cookie('userId', user.id);
      console.log('login successful!');
      loginResult.push('logged in');
      console.log(loginResult);
      response.render('loginsuccessful', { loginResult });
    } else {
      response.status(403).send('sorry!');
    }
  });
});

// DELETE function to log user out
app.delete('/logout', (request, response) => {
  const loginResult = [];
  console.log('request came in to logout');
  response.clearCookie('loggedIn');
  response.clearCookie('userId');
  console.log('successfully logged out');
  if (request.cookies.loggedIn === true) {
    loginResult.push('logged in');
  } else {
    loginResult.push('logged out');
  }
  response.render('logoutsuccessful', { loginResult });
});

app.set('view engine', 'ejs');

app.listen(80);
