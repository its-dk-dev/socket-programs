const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')

const io = new Server(server, {
    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
    }
})

const PORT = 3001

app.get("/", (req, res) => {
    console.log("Server started successfully")
    res.send("Server started successfully")
})

io.use((socket, next) => {
    const username = socket.handshake.auth.username;

    if (!username) {
      return next(new Error("invalid username"));
    }

    console.log("Midleware", username)
    socket.username = username;
    next();
});

io.on('connection', (socket) => {
    console.log(`User connected with ${socket.id}`)
    if (socket.recovered) {
        // recovery was successful: socket.id, socket.rooms and socket.data were restored
    } else {
        // new or unrecoverable session
    }

    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            id: id,
            name: socket.username,
            messages: []
        });
    }
    io.emit("newUserResponse", users);

    socket.on("message", ({message, to}) => {
        // This is for brodcast means except sender user
        // io.emit('message', args)
        // This is for indivisual
        io.to(to).emit('responseMessage', {message, from: socket.id})
    });



//     //Listens when a new user joins the server
//   socket.on('newUser', (data) => {
//     //Adds the new user to the list of users
//     users.push(data);
//     // console.log(users);
//     //Sends the list of users to the client
//     io.emit('newUserResponse', users);
//   });

    socket.on('typing', ({to}) => {
        io.to(to).emit('typingResponse', "typing...")
    })

    socket.on('disconnected', (socket) => {
        console.log("User disconnected")
        //Updates the list of users when a user disconnects from the server
        users = users.filter((user) => user.id !== socket.id);
        //Sends the list of users to the client
        io.emit('newUserResponse', users);
    })
})

server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`)
})
