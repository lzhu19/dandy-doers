import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Array to store user credentials, resets when server restarts
const creds = [];

function generateAccessToken(username) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { username: username },
      process.env.TOKEN_SECRET,
      { expiresIn: '1d' },
      (error, token) => {
        if (error) {
          reject(error);
        } else {
          resolve(token);
        }
      }
    );
  });
}

export function registerUser(req, res) {
  const { username, pwd } = req.body;

  if (!username || !pwd) {
    res.status(400).send('Bad request: Invalid input data.');
  } else if (creds.find((c) => c.username === username)) {
    res.status(409).send('Username already taken');
  } else {
    bcrypt
      .genSalt(10)
      .then((salt) => bcrypt.hash(pwd, salt))
      .then((hashedPassword) => {
        generateAccessToken(username).then((token) => {
          console.log('Token:', token);
          res.status(201).send({ token: token });
          creds.push({ username, hashedPassword });
        });
      })
      .catch((error) => {
        console.error('Could not register user: ', error);
        res.status(500).send('Could not register user');
      });
  }
}

export function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token received');
    res.status(401).end();
  } else {
    jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
      if (decoded) {
        next();
      } else {
        console.log('JWT error:', error);
        res.status(401).end();
      }
    });
  }
}

export function loginUser(req, res) {
  const { username, pwd } = req.body ?? {};
  const retrievedUser = creds.find((c) => c.username === username);

  if (!retrievedUser) {
    res.status(401).send('Unauthorized');
  } else {
    bcrypt
      .compare(pwd, retrievedUser.hashedPassword)
      .then((matched) => {
        if (matched) {
          generateAccessToken(username).then((token) => {
            res.status(200).send({ token: token });
          });
        } else {
          res.status(401).send('Unauthorized');
        }
      })
      .catch(() => {
        res.status(401).send('Unauthorized');
      });
  }
}
