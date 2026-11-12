import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './user.js';

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
  const { username, pwd } = req.body ?? {};

  if (
    typeof username !== 'string' ||
    typeof pwd !== 'string' ||
    !username ||
    !pwd
  ) {
    return res.status(400).send('Bad request: Invalid input data.');
  }

  User.findOne({ username })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).send('Username already taken');
        return null;
      }
      return bcrypt
        .genSalt(10)
        .then((salt) => bcrypt.hash(pwd, salt))
        .then((hashedPassword) => new User({ username, hashedPassword }).save())
        .then(() => generateAccessToken(username))
        .then((token) => res.status(201).send({ token: token }));
    })
    .catch((error) => {
      console.error('Could not register user: ', error);
      res.status(500).send('Could not register user');
    });
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

  if (typeof username !== 'string' || typeof pwd !== 'string') {
    return res.status(401).send('Unauthorized');
  }

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        res.status(401).send('Unauthorized');
        return null;
      }
      return bcrypt.compare(pwd, user.hashedPassword).then((matched) => {
        if (!matched) {
          res.status(401).send('Unauthorized');
          return null;
        }
        return generateAccessToken(username).then((token) =>
          res.status(200).send({ token: token })
        );
      });
    })
    .catch(() => {
      console.error('Could not log in user: ', error);
      res.status(500).send('Could not log in user');
    });
}
