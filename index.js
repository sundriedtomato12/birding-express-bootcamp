import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

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
    response.render('homepage', { data });
  });
});

// GET function to get page to create new note
app.get('/note', (request, response) => {
  console.log('request came in to get form to create new note');
  response.render('createnote');
});

// POST function post new note details into notes table
app.post('/note', (request, response) => {
  console.log('accept post request to create new note');
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
    response.render('notecreated');
  });
});

// GET function to get page of note by id
app.get('/note/:id', (request, response) => {
  console.log('request came in to get page of note id:');
  console.log(request.params.id);
  const id = [request.params.id];
  sqlQuery = 'SELECT * FROM notes WHERE id=$1';
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
    response.render('viewnote', { data });
  });
});

// GET function to get page to edit note by id
app.get('/note/:id/edit', (request, response) => {
  console.log('request came in to get page to edit note id:');
  console.log(request.params.index);
  const id = [request.params.id];
  sqlQuery = 'SELECT * FROM notes WHERE id=$1';
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
    response.render('editnote', { data });
  });
});

// PUT function to edit note by id
app.put('/note/:id/', (request, response) => {
  console.log('request came in to edit note id:');
  console.log(request.params.index);
});

// DELETE function to delete note by id
app.delete('/note/:id/delete', (request, response) => {
  console.log('request came in to delete note id:');
  console.log(request.params.index);
});

app.set('view engine', 'ejs');

app.listen(80);
