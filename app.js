const fs = require('fs');
const http = require('http');

// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = http.createServer(app);
const io = require('socket.io')(server);
const port = 80;

server.listen(port, () => {
	console.log(__dirname, port);
	
});


// Chatroom
let numUsers = 0;

io.on('connection', (socket) => {
	let addedUser = false;
	
	socket.broadcast.emit('test', {
		test: 'hello'
	});

	console.log('Added');

  // when the client emits 'new message', this listens and executes
	socket.on('new message', (data) => {
		
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
		});
		
		
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
		});
		
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
	});
	

	socket.on('adduser', (username) => {
		if (socket.username === username) {
			socket.broadcast.emit('olduserjoined', {
				username: socket.username
			})
		} else {
			socket.username = username;
			socket.join(username);
			socket.broadcast.emit('userjoined', {
				username: socket.username
			})
		}

		console.log(socket.username);
	});

	socket.on('sendmessage', (data) => {
		console.log(data.to);
		var users = JSON.parse(data.to);
		users.forEach(user => {
			console.log(user);
			if (socket.username != user) {
				io.to(user).emit('receivemessage', {
					data: {
						sender_id: data.sender_id,
						room_id: data.room_id,
						sender: data.sender,
						message: data.message
					}
				});
			}
		});
	});

	socket.on('sawmessage', (data) => {
		var users = JSON.parse(data.to);
		users.forEach(user => {
			if (user != socket.username) {
				io.to(user).emit('seenmessages', {
				room_id : data.room_id
			})
			
				
			}
		})
	})

});
