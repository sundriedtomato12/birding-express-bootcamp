import express from 'express';
import pg from 'pg';

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

let sqlQuery = '';
const inputData = [];

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

app.get('/note', (request, response) => {
  console.log('request came in to get form to create new note');
  response.render('createnote');
});

app.post('/note', (request, response) => {
  console.log('accept post request to create new note');
  sqlQuery = 'INSERT INTO notes (observation_date, behaviour, flock_size) VALUES ($1, $2, $3)';
  inputData.push(request.body.observation_date);
  inputData.push(request.body.behaviour);
  inputData.push(request.body.flock_size);

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

app.get('/note:id', (request, response) => {
  console.log('request came in to get page of note id:');
  console.log(request.params.id);
});

app.set('view engine', 'ejs');

app.listen(80);
