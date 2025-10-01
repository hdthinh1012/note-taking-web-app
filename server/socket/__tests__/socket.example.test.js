const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');

describe('Socket.IO Integration', () => {
  let io, server, clientSocket;

  beforeAll((done) => {
    server = http.createServer();
    io = new Server(server, { cors: { origin: '*' } });
    server.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        socket.on('ping', (msg) => {
          socket.emit('pong', msg);
        });
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    server.close();
  });

  it('should respond to ping with pong', (done) => {
    clientSocket.emit('ping', 'hello');
    clientSocket.on('pong', (msg) => {
      expect(msg).toBe('hello');
      done();
    });
  });
});
