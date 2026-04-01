import { io } from 'socket.io-client';

const URL = 'http://localhost:3001';

console.log('Testing Socket.io logic...');

// Simulate 3 users
const u1 = { userId: '111', displayName: 'Player1' };
const u2 = { userId: '222', displayName: 'Player2' };
const u3 = { userId: '333', displayName: 'Player3' };

let roomCode = null;

const s1 = io(URL, { auth: u1 });
const s2 = io(URL, { auth: u2 });
const s3 = io(URL, { auth: u3 });

let res = {
  connect: false,
  create: false,
  join: 0,
  start: false,
  wordReceived: 0,
  error: null
};

setTimeout(() => {
  console.log('Test timed out (10s)');
  console.log(JSON.stringify(res, null, 2));
  process.exit(1);
}, 10000);

s1.on('connect', () => {
  res.connect = true;
  s1.emit('room:create', { settings: { rounds: 1 } }, (response) => {
    if (response?.success) {
      res.create = true;
      roomCode = response.room.code;
      
      s2.emit('room:join', { roomCode }, (r2) => {
        if (r2?.success) res.join++;
        s3.emit('room:join', { roomCode }, (r3) => {
          if (r3?.success) {
            res.join++;
            // Start game
            s1.emit('game:start', { roomCode }, (startRes) => {
              if (startRes?.success) {
                res.start = true;
              } else {
                 console.error('Failed to start game', startRes);
                 res.error = startRes?.error;
              }
            });
          }
        });
      });
    } else {
        res.error = response?.error;
        console.log("Create room failed", response);
    }
  });
});

const onWord = (data) => {
  res.wordReceived++;
  if (res.wordReceived === 3) {
    console.log('End to end game start flow works!');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  }
};

s1.on('game:word', onWord);
s2.on('game:word', onWord);
s3.on('game:word', onWord);
