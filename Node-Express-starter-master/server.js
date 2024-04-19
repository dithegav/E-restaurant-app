const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'helloworld',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Sign-up endpoint
app.post('/signup', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [check_username] = await connection.execute (
          'SELECT * FROM users WHERE username = ?', [username]
      );

      if (check_username.length != 0){
        return res.status(401).json({ error: 'Please try a different username' });
      }

      // Insert user details into the Users table with the hashed password
      const [insertUserResult] = await connection.execute(
        'INSERT INTO Users (username, password, firstName, lastName) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, firstName, lastName]
      );

      // Commit the transaction
      await connection.commit();

      res.json({ message: 'User registered successfully'});
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    console.log(username);

    // Find the user by username
    const [userRows] = await pool.execute(
      'SELECT * FROM Users WHERE username = ?',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userRows[0];
    console.log(user.userID);

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful', userID: user.userID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login endpoint
app.post('/login2', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    console.log(username);

    // Find the user by username
    const [userRows] = await pool.execute(
      'SELECT userID, password, firstName, lastName FROM Users WHERE username = ?',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userRows[0];
    console.log(user.userID);

    const userID = user.userID;
    const firstName = user.firstName;

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);


    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful', user});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Delete user
app.delete('/delete_user/:userID', async (req, res) => {
  try {
    const userID = req.params.userID;

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {

      await connection.execute('DELETE FROM Reservations WHERE userID = ?', [userID]);

      // Delete the user from the Users table
      await connection.execute('DELETE FROM Users WHERE userID = ?', [userID]);

      // Commit the transaction
      await connection.commit();

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update password
app.patch('/update_password', async (req, res) => {
  try {
    const userID = req.body.userID;
    const password = req.body.password;

    console.log(userID);
    console.log(password);

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update the user's password in the Users table
      await connection.execute('UPDATE Users SET password = ? WHERE userID = ?', [hashedPassword, userID]);

      // Commit the transaction
      await connection.commit();

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error'});
  }
});

//return data from user
app.get('/user_data', async (req, res) => {
  try {
    const userID = req.query.userID;

    console.log(userID);

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [returnDataUser] = await connection.execute(
        'SELECT username, firstName, lastName FROM users WHERE userID = ?', [userID]
      );

      // Commit the transaction
      await connection.commit();
      console.log(returnDataUser);
      res.json({message : "User_data successfully returned ", returnDataUser});
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Add a new restaurant
app.post('/new_restaurants', async (req, res) => {
  try {
    const name = req.body.name;
    const cuisine_type = req.body.cuisine_type;
    const location = req.body.location;
    const numTables = req.body.numTables;
    const expensive = req.body.expensive;

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert restaurant details into the Restaurants table
      const [insertRestaurantResult] = await connection.execute(
        'INSERT INTO Restaurants (name, cuisine_type, location, numTables, expensive) VALUES (?, ?, ?, ?, ?)',
        [name, cuisine_type, location, numTables, expensive]
      );

      // Get the restaurant ID of the newly inserted restaurant
      const restaurantID = insertRestaurantResult.insertId;

      // Commit the transaction
      await connection.commit();

      res.json({ message: 'Restaurant added successfully', restaurantID });
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add multiple restaurants
app.post('/mult_restaurants', async (req, res) => {
  try {
    const restaurants = req.body;

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const restaurantIDs = [];

      // Insert each restaurant details into the Restaurants table
      for (const restaurant of restaurants) {
        const { name, cuisine_type, location, numTables, expensive } = restaurant;

        const [insertRestaurantResult] = await connection.execute(
          'INSERT INTO Restaurants (name, cuisine_type, location, numTables, expensive) VALUES (?, ?, ?, ?, ?)',
          [name, cuisine_type, location, numTables, expensive]
        );

        // Get the restaurant ID of the newly inserted restaurant
        const restaurantID = insertRestaurantResult.insertId;
        restaurantIDs.push(restaurantID);
      }

      // Commit the transaction
      await connection.commit();

      res.json({ message: 'Restaurants added successfully', restaurantIDs });
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//insert reservation
app.post('/reserve', async (req, res) => {
  try {
    const { userID, availabilityID, reservationDateTime, closingTime, numPeople } = req.body;

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert reservation details into the Reservations table
      const [insertReservationResult] = await connection.execute(
        'INSERT INTO Reservations (userID, availabilityID, reservationDateTime, closingTime, numPeople) VALUES (?, ?, ?, ?, ?)',
        [userID, availabilityID, reservationDateTime, closingTime, numPeople]
      );

      // Get the reservation ID of the newly inserted reservation
      const reservationID = insertReservationResult.insertId;

      // Commit the transaction
      await connection.commit();

      res.json({ message: 'Reservation created successfully', reservationID });
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//for tables with different number of people
app.post('/reserve_check_temp', async (req, res) => {
  try {
    //const { userID, resName, reservationStartTime, numPeople } = req.body;
    const userID = req.body.userID;
    const resName = req.body.resName;
    const reservationStartTime = req.body.reservationStartTime;
    const numPeople = req.body.numPeople;

    console.log({message : "UserID :",userID});
    console.log({message : "resName :",resName});
    console.log({message : "reservationStartTime :",reservationStartTime});
    console.log({message : "numPeople :",numPeople});

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();  // Start the transaction.

    try {
      const [restaurantInfo] = await connection.execute(
        'SELECT numTables, restaurantID FROM Restaurants WHERE name = ?',
        [resName]
      );
  
      if (restaurantInfo.length === 0) {
        // Restaurant not found, return an error
        return res.status(400).json({ error: 'Invalid restaurant name.' });
      }
  
      const numTables = restaurantInfo[0].numTables;
      const restaurantID = restaurantInfo[0].restaurantID;

      let chosenTableID = null;
      let availabilityID = null;

      // Iterate over table numbers (e.g., 'Table1', 'Table2', etc.)
      for (let tableNumber = 1; tableNumber <= numTables; tableNumber++) {
        // Check if the table is suitable for the reservation
        const [tableAvailability] = await connection.execute(
          'SELECT * FROM TableAvailability ' +
          'WHERE restaurantID = ? AND tableNumber = ? AND numPeople >= ?',
          [restaurantID, `Table${tableNumber}`, numPeople]
        );

        const BeforeReservationDateTime = new Date(reservationStartTime);
        BeforeReservationDateTime.setMinutes(BeforeReservationDateTime.getMinutes() + 1);

        if (tableAvailability.length > 0) {
          // Check if the table is already reserved during the specified time range
          const [existingReservations] = await connection.execute(
            'SELECT R.* FROM Reservations R JOIN TableAvailability TA ON R.availabilityID = TA.availabilityID ' +
            'WHERE TA.restaurantID = ? AND TA.tableNumber = ? ' +
            'AND ? BETWEEN R.reservationStartTime AND R.closingTime',
            [restaurantID, `Table${tableNumber}`, BeforeReservationDateTime]
          );

          if (existingReservations.length === 0) {
            // The table is available and suitable for the reservation

            
            BeforeReservationDateTime.setHours(BeforeReservationDateTime.getHours() + 1);
            BeforeReservationDateTime.setMinutes(BeforeReservationDateTime.getMinutes() + 29);

            const [existingReservations2] = await connection.execute(
              'SELECT R.* FROM Reservations R JOIN TableAvailability TA ON R.availabilityID = TA.availabilityID ' +
              'WHERE TA.restaurantID = ? AND TA.tableNumber = ? ' +
              'AND ? BETWEEN R.reservationStartTime AND R.closingTime',
              [restaurantID, `Table${tableNumber}`, BeforeReservationDateTime]
            );

            if (existingReservations2.length === 0) {
              chosenTableID = tableNumber;
              availabilityID = tableAvailability[0].availabilityID;
              break; // Break the loop if an available table is found
            }
          }
        }
      }

      if (!chosenTableID) {
        // No available tables found, return an error
        await connection.rollback();  // Rollback the transaction.
        return res.status(400).json({ error: 'No suitable tables for reservation.' });
      }

      console.log({message : "tablenumber :",chosenTableID});

      // Calculate new closingDateTime (2 hours after adjusted reservationStartTime)
      const closingDateTime = new Date(reservationStartTime);
      closingDateTime.setHours(closingDateTime.getHours() + 2);


      // Insert reservation details into the Reservations table
      const [insertReservationResult] = await connection.execute(
        'INSERT INTO Reservations (userID, availabilityID, reservationStartTime, closingTime, numPeople) VALUES (?, ?, ?, ?, ?)',
        [userID, availabilityID, reservationStartTime, closingDateTime, numPeople]
      );

      // Commit the transaction
      await connection.commit();  // Commit the transaction.

      res.json({ message: 'Check was successful'});
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();  // Rollback the transaction.
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/restaurants_multiTypes', async (req, res) => {
  let restaurants;
  try {
    const name = req.query.name;
    const cuisine_type = req.query.cuisine_type;
    const location = req.query.location;
    //const { name, cuisine_type, location } = req.body;
    console.log(cuisine_type);
    console.log(location);
    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let query = 'SELECT * FROM Restaurants WHERE 1';

      // Dynamically add conditions based on the provided parameters
      const conditions = [];

      if (name) {
        conditions.push('name LIKE ?');
      }
      
      if (cuisine_type) {
        if (Array.isArray(cuisine_type)) {
          // Use OR clause for multiple cuisines
          conditions.push('(' + cuisine_type.map(_ => 'cuisine_type LIKE ?').join(' OR ') + ')');
        } else {
          // Single cuisine
          conditions.push('cuisine_type LIKE ?');
        }
      }

      if (location) {
        conditions.push('location LIKE ?');
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      // Prepare the parameters array
      const params = [];
      if (name) params.push(`%${name}%`);
      if (cuisine_type) {
        if (Array.isArray(cuisine_type)) {
          params.push(...cuisine_type.map(ct => `%${ct}%`));
        } else {
          params.push(`%${cuisine_type}%`);
        }
      }
      if (location) params.push(`%${location}%`);

      // Execute the query
      restaurants= await connection.execute(query, params);
      const [restaurant] = restaurants;


      // Commit the transaction
      await connection.commit();
      console.log(restaurant);

      res.json(restaurant);
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/reservation_history', async (req, res) => {
  try {
    const { userID } = req.body;

    // Use a transaction to ensure atomicity of the operations
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Fetch reservations for the specified user along with restaurant information
      const [reservations] = await connection.execute(
        'SELECT DISTINCT R.availabilityID, R.reservationStartTime, R.numPeople, RT.name AS resName ' +
        'FROM Reservations R ' +
        'JOIN TableAvailability T ON R.availabilityID = T.availabilityID ' +
        'JOIN Restaurants RT ON T.restaurantID = RT.restaurantID ' +
        'WHERE R.userID = ?',
        [userID]
      );

      // Commit the transaction
      await connection.commit();

      res.json(reservations);
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//add pedio restaurants me $$$$ me times poso prosito einai 

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
