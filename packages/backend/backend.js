import express from "express";
import cors from "cors";
import {
  addUser,
  deleteUser,
  findUserById,
  getUsers,
} from "./user-services.js";


const app = express(); // setup api
const port = 8000; // port number


////////// SETUP //////////

app.use(cors());
app.use(express.json());


////////// GET //////////

app.get("/", (req, res) => { // HTTP GET request
    // main page
    res.send("Hello, world!!!!");
});

app.get("/users", (req, res) => {
    // sends list of users, filtered by a query if given one
    getUsers()
        .then((users) => res.status(200).json(users))
        .catch((error) => res.status(500).send(error));
});

app.get("/users/:id", (req, res) => { // /users/idValue
    // direct endpoint for resource
    findUserById(req.params.id)
        .then((user) => user ? res.status(200).json(user) : res.sendStatus(404))
        .catch((error) => res.status(404).send(error));
});


////////// POST //////////

app.post("/users", (req, res) => {
    // add a user to the users list with a POST HTTP request
    addUser(req.body)
        .then((user) => res.status(201).json(user))
        .catch((error) => res.status(500).send(error));
})


////////// DELETE //////////

app.delete("/users/:id", (req, res) => { // curl -X DELETE http://localhost:8000/users/abc123
    // delete a user by id from the users list if it exists
    deleteUser(req.params.id)
        .then((user) => user ? res.sendStatus(204) : res.status(404).send("Resource not found. Cannot delete."))
        .catch((error) => res.status(500).send(error));
})


////////// listen //////////

app.listen(port, () => { // listen to HTTP requests on this port
    console.log(
        `Example app listening at http://localhost:${port}`
    );
});