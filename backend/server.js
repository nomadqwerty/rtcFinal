// import {Server} from "socket.io";
// import express from 'express';
// import { createServer } from 'node:http';
const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const fs = require("node:fs");
const { Server } = require("socket.io");

// import { fileURLToPath } from 'node:url';
// import {dirname, join} from 'node:path';
// import { Server } from "socket.io";
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const cors = require("cors"); // Import the cors middleware
const PORT = 3050;
const mediasoup = require("mediasoup");

const ipAdd = "127.0.0.1";

// async function main() {
// open the database file
// const db = await open({
//   filename: "chat.db",
//   driver: sqlite3.Database,
// });

// create our 'messages' table (you can ignore the 'client_offset' column for now)
//   await db.exec(`
//   CREATE TABLE IF NOT EXISTS messages (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       client_offset TEXT UNIQUE,
//       content TEXT
//   );
// `);

// const express = require('express');

const options = {
  // key: fs.readFileSync("./ssl/key.pem", "utf-8"),
  // cert: fs.readFileSync("./ssl/cert.pem", "utf-8"),
};
const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  debug: true,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//   const corsOptions = {
//     origin: 'http://localhost:3000',
//     optionsSuccessStatus: 200
// };

// app.use(cors(corsOptions));
app.use(cors()); // Use cors middleware for all routes

// app.get('/',(req,res) => {
//     res.send('<h1>Damn we getting into the backend</h1>');
// });
// const __dirname = dirname(fileURLToPath(import.meta.url));

//get chatapp directory and ouput selected file
// app.get('/chatapp', (req, res) => {
//   res.sendFile(join(__dirname, 'index.html'));
// });

//get homepage and output file
// app.get('/', (req, res) => {
//   res.sendFile(join(__dirname, 'HomePage.js'));
// });

// Initialize a counter for connected clients
let connectedClients = 0;
let roomAccessKey;
let worker;
let router;
let producerTransport;
let consumerTransport;
let producer;
let consumer;
const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {
      "x-google-start-bitrate": 1000,
    },
  },
];
const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 3000,
    rtcMaxPort: 3100,
  });
  console.log(`worker pid ${worker.pid}`);

  worker.on("died", (error) => {
    // This implies something serious happened, so kill the application
    console.error("mediasoup worker has died");
    setTimeout(() => process.exit(1), 2000); // exit in 2 seconds
  });

  return worker;
};

worker = createWorker();

const rooms = [];
io.on("connection", async (socket) => {
  //listen for roomAccesskey event on socket join and add socket to the provided acceskey

  // handle device change
  socket.on("deviceChanged", ({ roomAccessKey }) => {
    socket.broadcast.to(roomAccessKey).emit("deviceChanged");
  });

  socket.on("roomAccessKey", (data) => {
    const { roomToJoin, clientName } = data;
    try {
      roomAccessKey = roomToJoin;
      socket.join(roomToJoin);
      // console.log("joined room",roomToJoin)
      socket.broadcast.to(roomToJoin).emit("newUserJoined", {
        userSocketID: socket.id,
        room: roomToJoin,
        remoteName: clientName,
      });
    } catch (e) {
      console.log("could not join roomAccessKey", e);
    }
  });

  socket.on("localClientName", (data) => {
    try {
      console.log("local user", data, "joined room", roomAccessKey);
      socket.broadcast
        .to(roomAccessKey)
        .emit("remoteName", { remoteName: data });
    } catch (e) {
      console.log("could not emit remotename", e);
    }
  });

  // return all Socket instances of the main namespace
  // const sockets = await io.fetchSockets();

  //       for (const socket of sockets) {
  //         console.log(socket.id);
  //         console.log(socket.handshake);
  //         console.log(socket.rooms);
  //         console.log(socket.data);
  //       }

  // Increment the counter when a new client connects
  connectedClients++;
  console.log(
    socket.id + " connected. Total connected clients:",
    connectedClients
  );

  // Listen for sendoffer event and forward to recepient
  socket.on("sendMessage", (data) => {
    // get data of socket who initiated sendMessage { recipientId, message }
    const { userID, roomAccessKey, text } = data;

    // Send the message to the a user who just joined the server
    socket.broadcast
      .to(roomAccessKey)
      .emit("incomingMsg", { userID: socket.id, text });
  });

  socket.on("chat message", (data) => {
    const { msg, clientOffset, roomAccessKey, clientName } = data;
    console.log("message from: ", msg, clientOffset, "room", roomAccessKey);

    io.to(roomAccessKey).emit("chat message", {
      msg: msg,
      serverOffset: clientOffset,
      clientName: clientName,
    });
  });

  socket.on("disconnect", () => {
    connectedClients--;
    console.log(
      socket.id + " disconnected. Total connected clients:",
      connectedClients
    );
    socket.broadcast
      .to(roomAccessKey)
      .emit("userDisconnected", { userID: socket.id });
  });

  socket.on("remote-camera", (data) => {
    const { roomAccessKey, cameraState } = data;
    if (cameraState == "off" || false) {
      console.log("user off cam", data);
    } else {
      console.log("user ON cam", data);
    }
    socket.broadcast.to(roomAccessKey).emit("remote-camera", cameraState);
  });

  socket.on("retryRtcConnection", (data) => {
    console.log("retry request");
    data.from = data.from || socket.id;
    socket.to(data.to).emit("reloadPage", data);
  });
  socket.on("createdNewAnswer", (data) => {
    console.log("here");
    console.log(data.from, data.to);
    data.from = data.from || socket.id;
    socket.to(data.to).emit("reloadComplete", data);
  });
  socket.on("retryRtcConnectionFull", (data) => {
    console.log("retry request");
    data.from = data.from || socket.id;
    socket.to(data.to).emit("reloadFullPage", data);
  });
  /////////////////////////////////////////////
  // TODO: media soup.
  /* 
{
callerId:string,
answerId:string,
router:object,
audioRouter:object,
hostProducerTransport:object,
hostAudioProducerTransport
hostConsumerTransport:object,
clientProducerTransport:object,
clientConsumerTransport:object,
clientAudioConsumerTransport:object
producer:object,
audioProducer:object,
consumer:object,
audioConsumer:object,
hostConsumer:object,
hostAudioConsumer:object,

}
*/
  socket.on("createRoom", async (callback) => {
    let isInRoom = false;
    console.log("new room");
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].callerId === socket.id || rooms[i].answerId === socket.id) {
        isInRoom = true;
      }
    }
    if (!isInRoom) {
      const newRouter = await worker.createRouter({
        mediaCodecs: [
          {
            kind: "video",
            mimeType: "video/VP8",
            clockRate: 90000,
            parameters: {
              "x-google-start-bitrate": 1000,
            },
          },
        ],
      });
      const newAudioRouter = await worker.createRouter({
        mediaCodecs: [
          {
            kind: "audio",
            mimeType: "audio/opus",
            clockRate: 48000,
            channels: 2,
          },
        ],
      });
      rooms.push({
        callerId: socket.id,
        router: newRouter,
        audioRouter: newAudioRouter,
      });

      const rtpCapabilities = newRouter.rtpCapabilities;
      const audioRtpCapabilities = newAudioRouter.rtpCapabilities;

      callback({ rtpCapabilities, audioRtpCapabilities, room: true });
    }
  });

  socket.on("joinRoom", async (canConsume, callback) => {
    let isInRoom = false;
    console.log("join room");
    console.log(canConsume);
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].callerId === canConsume.from) {
        isInRoom = true;

        rooms[i].answerId = canConsume.to;
        callback({
          rtpCapabilities: rooms[i].router.rtpCapabilities,
          audioRtpCapabilities: rooms[i].audioRouter.rtpCapabilities,
          room: false,
        });
      }
    }
  });
  socket.on("setClientProduce", async (canConsume, callback) => {
    console.log("client produce");
    console.log(canConsume);
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].answerId === socket.id || rooms[i].callerId === socket.id) {
        // console.log(rooms[i].router.rtpCapabilities);
        callback({
          rtpCapabilities: rooms[i].router.rtpCapabilities,
          audioRtpCapabilities: rooms[i].audioRouter.rtpCapabilities,
        });
      }
    }
  });
  socket.on("setHostConsume", async (canConsume, callback) => {
    console.log("hsot consume");
    console.log(canConsume);
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].answerId === socket.id || rooms[i].callerId === socket.id) {
        // console.log(rooms[i].router.rtpCapabilities);
        callback({
          rtpCapabilities: rooms[i].router.rtpCapabilities,
          audioRtpCapabilities: rooms[i].audioRouter.rtpCapabilities,
        });
      }
    }
  });

  socket.on("createWebRtcTransport", async ({ sender }, callback) => {
    console.log(`Is this a sender request? ${sender}`);
    // The client indicates if it is a producer or a consumer
    // if sender is true, indicates a producer else a consumer
    if (sender) {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: "0.0.0.0", // replace with relevant IP address
            announcedIp: ipAdd,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].callerId === socket.id) {
          const hostProducerTransport = await rooms[
            i
          ].router.createWebRtcTransport(webRtcTransport_options);

          const hostAudioProducerTransport = await rooms[
            i
          ].audioRouter.createWebRtcTransport(webRtcTransport_options);

          rooms[i].hostProducerTransport = hostProducerTransport;
          rooms[i].hostAudioProducerTransport = hostAudioProducerTransport;

          console.log(`transport id: ${rooms[i].hostProducerTransport.id}`);
          console.log(
            `audio transport id: ${rooms[i].hostAudioProducerTransport.id}`
          );

          rooms[i].hostProducerTransport.on("dtlsstatechange", (dtlsState) => {
            if (dtlsState === "closed") {
              rooms[i].hostProducerTransport.close();
            }
          });
          rooms[i].hostAudioProducerTransport.on(
            "dtlsstatechange",
            (dtlsState) => {
              if (dtlsState === "closed") {
                rooms[i].hostAudioProducerTransport.close();
              }
            }
          );

          rooms[i].hostProducerTransport.on("close", () => {
            console.log("transport closed");
          });
          rooms[i].hostAudioProducerTransport.on("close", () => {
            console.log("audio transport closed");
          });

          callback({
            params: {
              id: rooms[i].hostProducerTransport.id,
              iceParameters: rooms[i].hostProducerTransport.iceParameters,
              iceCandidates: rooms[i].hostProducerTransport.iceCandidates,
              dtlsParameters: rooms[i].hostProducerTransport.dtlsParameters,
            },
            params2: {
              id: rooms[i].hostAudioProducerTransport.id,
              iceParameters: rooms[i].hostAudioProducerTransport.iceParameters,
              iceCandidates: rooms[i].hostAudioProducerTransport.iceCandidates,
              dtlsParameters:
                rooms[i].hostAudioProducerTransport.dtlsParameters,
            },
          });
        }
      }
    } else {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: "0.0.0.0", // replace with relevant IP address
            announcedIp: ipAdd,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].answerId === socket.id) {
          const clientConsumerTransport = await rooms[
            i
          ].router.createWebRtcTransport(webRtcTransport_options);

          const clientAudioConsumerTransport = await rooms[
            i
          ].audioRouter.createWebRtcTransport(webRtcTransport_options);

          rooms[i].clientConsumerTransport = clientConsumerTransport;

          rooms[i].clientAudioConsumerTransport = clientAudioConsumerTransport;

          console.log(`transport id: ${rooms[i].clientConsumerTransport.id}`);
          console.log(
            `audio transport id: ${rooms[i].clientAudioConsumerTransport.id}`
          );

          rooms[i].clientConsumerTransport.on(
            "dtlsstatechange",
            (dtlsState) => {
              if (dtlsState === "closed") {
                rooms[i].clientConsumerTransport.close();
              }
            }
          );
          rooms[i].clientAudioConsumerTransport.on(
            "dtlsstatechange",
            (dtlsState) => {
              if (dtlsState === "closed") {
                rooms[i].clientAudioConsumerTransport.close();
              }
            }
          );

          rooms[i].clientConsumerTransport.on("close", () => {
            console.log("transport closed");
          });
          rooms[i].clientAudioConsumerTransport.on("close", () => {
            console.log("transport closed");
          });

          callback({
            params: {
              id: rooms[i].clientConsumerTransport.id,
              iceParameters: rooms[i].clientConsumerTransport.iceParameters,
              iceCandidates: rooms[i].clientConsumerTransport.iceCandidates,
              dtlsParameters: rooms[i].clientConsumerTransport.dtlsParameters,
            },
            params2: {
              id: rooms[i].clientAudioConsumerTransport.id,
              iceParameters:
                rooms[i].clientAudioConsumerTransport.iceParameters,
              iceCandidates:
                rooms[i].clientAudioConsumerTransport.iceCandidates,
              dtlsParameters:
                rooms[i].clientAudioConsumerTransport.dtlsParameters,
            },
          });
        }
      }
    }
  });

  socket.on(
    "transport-connect",
    async ({ dtlsParameters, msRoom, isAudio }) => {
      console.log(msRoom);
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].callerId === socket.id) {
          if (msRoom && isAudio !== true) {
            console.log("DTLS PARAMS... ", { dtlsParameters });
            await rooms[i].hostProducerTransport.connect({ dtlsParameters });
          } else if (msRoom && isAudio === true) {
            console.log("Audio DTLS PARAMS... ", { dtlsParameters });
            await rooms[i].hostAudioProducerTransport.connect({
              dtlsParameters,
            });
          }
        }
      }
    }
  );
  socket.on(
    "transport-produce",
    async ({ kind, rtpParameters, appData, msRoom, isAudio }, callback) => {
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].callerId === socket.id) {
          if (msRoom && isAudio !== true) {
            console.log(msRoom);
            console.log(kind);
            let producer = await rooms[i].hostProducerTransport.produce({
              kind,
              rtpParameters,
            });

            console.log("Producer ID: ", producer.id, producer.kind);

            producer.on("transportclose", () => {
              console.log("transport for this producer closed ");
              producer.close();
            });
            rooms[i].producer = producer;
            callback({
              id: producer.id,
            });
          } else if (msRoom && isAudio === true) {
            console.log(msRoom);
            console.log(kind);
            let audioProducer = await rooms[
              i
            ].hostAudioProducerTransport.produce({
              kind,
              rtpParameters,
            });

            console.log(
              "Audio Producer ID: ",
              audioProducer.id,
              audioProducer.kind
            );

            audioProducer.on("transportclose", () => {
              console.log("transport for this audioProducer closed ");
              audioProducer.close();
            });
            rooms[i].audioProducer = audioProducer;
            callback({
              id: audioProducer.id,
            });
          }
        }
      }
    }
  );

  socket.on("remoteConsume", (data) => {
    console.log(data);
    socket.to(data.to).emit("cosumeMedia", data);
  });

  socket.on("transport-recv-connect", async ({ dtlsParameters, isAudio }) => {
    console.log(`DTLS PARAMS: ${dtlsParameters}`);
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].answerId === socket.id && isAudio !== true) {
        await rooms[i].clientConsumerTransport.connect({ dtlsParameters });
      } else if (rooms[i].answerId === socket.id && isAudio === true) {
        await rooms[i].clientAudioConsumerTransport.connect({ dtlsParameters });
      }
    }
  });

  socket.on(
    "consume",
    async ({ rtpCapabilities, audioRtpCapabilities }, callback) => {
      try {
        // check if the router can consume the specified producer
        for (let i = 0; i < rooms.length; i++) {
          if (rooms[i].answerId === socket.id) {
            if (
              rooms[i].router.canConsume({
                producerId: rooms[i].producer.id,
                rtpCapabilities,
              }) &&
              rooms[i].audioRouter.canConsume({
                producerId: rooms[i].audioProducer.id,
                rtpCapabilities: audioRtpCapabilities,
              })
            ) {
              //   // transport can now consume and return a consumer
              let consumer = await rooms[i].clientConsumerTransport.consume({
                producerId: rooms[i].producer.id,
                rtpCapabilities,
                paused: true,
              });
              let audioConsumer = await rooms[
                i
              ].clientAudioConsumerTransport.consume({
                producerId: rooms[i].audioProducer.id,
                rtpCapabilities: audioRtpCapabilities,
                paused: true,
              });

              consumer.on("transportclose", () => {
                console.log("transport close from consumer");
              });
              audioConsumer.on("transportclose", () => {
                console.log("transport close from consumer");
              });

              consumer.on("producerclose", () => {
                console.log("producer of consumer closed");
              });
              audioConsumer.on("producerclose", () => {
                console.log("producer of consumer closed");
              });

              rooms[i].consumer = consumer;
              rooms[i].audioConsumer = audioConsumer;

              //   // from the consumer extract the following params
              //   // to send back to the Client
              const params = {
                id: rooms[i].consumer.id,
                producerId: rooms[i].producer.id,
                kind: rooms[i].consumer.kind,
                rtpParameters: rooms[i].consumer.rtpParameters,
              };

              const params2 = {
                id: rooms[i].audioConsumer.id,
                producerId: rooms[i].audioProducer.id,
                kind: rooms[i].audioConsumer.kind,
                rtpParameters: rooms[i].audioConsumer.rtpParameters,
              };

              //   // send the parameters to the client
              callback({ params, params2 });
            }
          }
        }
      } catch (error) {
        console.log(error.message);
        callback({
          params: {
            error: error,
          },
        });
      }
    }
  );

  socket.on("consumer-resume", async () => {
    console.log("consumer resume");
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].answerId === socket.id) {
        await rooms[i].consumer.resume();
        await rooms[i].audioConsumer.resume();
      }
    }
  });

  socket.on("createWebRtcTransportClient", async ({ sender }, callback) => {
    console.log(`Is this a sender request? ${sender}`);
    // The client indicates if it is a producer or a consumer
    // if sender is true, indicates a producer else a consumer
    if (sender) {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: "0.0.0.0", // replace with relevant IP address
            announcedIp: ipAdd,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].answerId === socket.id) {
          const clientProducerTransport = await rooms[
            i
          ].router.createWebRtcTransport(webRtcTransport_options);

          const clientAudioProducerTransport = await rooms[
            i
          ].audioRouter.createWebRtcTransport(webRtcTransport_options);

          rooms[i].clientProducerTransport = clientProducerTransport;
          rooms[i].clientAudioProducerTransport = clientAudioProducerTransport;

          console.log(`transport id: ${rooms[i].clientProducerTransport.id}`);
          console.log(
            `audio transport id: ${rooms[i].clientAudioProducerTransport.id}`
          );

          rooms[i].clientProducerTransport.on(
            "dtlsstatechange",
            (dtlsState) => {
              if (dtlsState === "closed") {
                rooms[i].clientProducerTransport.close();
              }
            }
          );
          rooms[i].clientAudioProducerTransport.on(
            "dtlsstatechange",
            (dtlsState) => {
              if (dtlsState === "closed") {
                rooms[i].clientAudioProducerTransport.close();
              }
            }
          );

          rooms[i].clientProducerTransport.on("close", () => {
            console.log("transport closed");
          });
          rooms[i].clientAudioProducerTransport.on("close", () => {
            console.log("transport closed");
          });
          console.log("callback");
          callback({
            params: {
              id: rooms[i].clientProducerTransport.id,
              iceParameters: rooms[i].clientProducerTransport.iceParameters,
              iceCandidates: rooms[i].clientProducerTransport.iceCandidates,
              dtlsParameters: rooms[i].clientProducerTransport.dtlsParameters,
            },
            params2: {
              id: rooms[i].clientAudioProducerTransport.id,
              iceParameters:
                rooms[i].clientAudioProducerTransport.iceParameters,
              iceCandidates:
                rooms[i].clientAudioProducerTransport.iceCandidates,
              dtlsParameters:
                rooms[i].clientAudioProducerTransport.dtlsParameters,
            },
          });
        }
      }
    } else {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: "0.0.0.0", // replace with relevant IP address
            announcedIp: ipAdd,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].callerId === socket.id) {
          const hostConsumerTransport = await rooms[
            i
          ].router.createWebRtcTransport(webRtcTransport_options);
          const hostAudioConsumerTransport = await rooms[
            i
          ].audioRouter.createWebRtcTransport(webRtcTransport_options);

          rooms[i].hostConsumerTransport = hostConsumerTransport;
          rooms[i].hostAudioConsumerTransport = hostAudioConsumerTransport;

          console.log(`transport id: ${rooms[i].hostConsumerTransport.id}`);
          console.log(
            `aduio transport id: ${rooms[i].hostAudioConsumerTransport.id}`
          );

          rooms[i].hostConsumerTransport.on("dtlsstatechange", (dtlsState) => {
            if (dtlsState === "closed") {
              rooms[i].hostConsumerTransport.close();
            }
          });
          rooms[i].hostAudioConsumerTransport.on(
            "dtlsstatechange",
            (dtlsState) => {
              if (dtlsState === "closed") {
                rooms[i].hostAudioConsumerTransport.close();
              }
            }
          );

          rooms[i].hostConsumerTransport.on("close", () => {
            console.log("transport closed");
          });
          rooms[i].hostAudioConsumerTransport.on("close", () => {
            console.log("transport closed");
          });

          callback({
            params: {
              id: rooms[i].hostConsumerTransport.id,
              iceParameters: rooms[i].hostConsumerTransport.iceParameters,
              iceCandidates: rooms[i].hostConsumerTransport.iceCandidates,
              dtlsParameters: rooms[i].hostConsumerTransport.dtlsParameters,
            },
            params2: {
              id: rooms[i].hostAudioConsumerTransport.id,
              iceParameters: rooms[i].hostAudioConsumerTransport.iceParameters,
              iceCandidates: rooms[i].hostAudioConsumerTransport.iceCandidates,
              dtlsParameters:
                rooms[i].hostAudioConsumerTransport.dtlsParameters,
            },
          });
        }
      }
    }
  });
  socket.on(
    "transport-connect-client",
    async ({ dtlsParameters, msRoom, isAudio }) => {
      console.log(msRoom);
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].answerId === socket.id) {
          if (msRoom === false && isAudio !== true) {
            console.log("DTLS PARAMS... client connect", { dtlsParameters });
            await rooms[i].clientProducerTransport.connect({ dtlsParameters });
          } else if (msRoom === false && isAudio === true) {
            await rooms[i].clientAudioProducerTransport.connect({
              dtlsParameters,
            });
          }
        }
      }
    }
  );
  socket.on(
    "transport-produce-client",
    async ({ kind, rtpParameters, appData, msRoom, isAudio }, callback) => {
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].answerId === socket.id) {
          if (msRoom === false && isAudio !== true) {
            console.log(msRoom);
            console.log(kind);
            let producer = await rooms[i].clientProducerTransport.produce({
              kind,
              rtpParameters,
            });

            console.log("Producer ID: ", producer.id, producer.kind);

            producer.on("transportclose", () => {
              console.log("transport for this producer closed ");
              producer.close();
            });
            rooms[i].clientProducer = producer;
            callback({
              id: producer.id,
            });
          }
        }
        if (rooms[i].answerId === socket.id) {
          if (msRoom === false && isAudio === true) {
            console.log(msRoom);
            console.log(kind);
            let producer = await rooms[i].clientAudioProducerTransport.produce({
              kind,
              rtpParameters,
            });

            console.log("AUDIO Producer ID: ", producer.id, producer.kind);

            producer.on("transportclose", () => {
              console.log("transport for this producer closed ");
              producer.close();
            });
            rooms[i].clientAudioProducer = producer;
            callback({
              id: producer.id,
            });
          }
        }
      }
    }
  );

  socket.on("setHostCanConsume", (data) => {
    console.log(data);
    socket.to(data.to).emit("cosumeClientMedia", data);
  });

  socket.on(
    "transport-recv-connect-host",
    async ({ dtlsParameters, isAudio }) => {
      console.log(`DTLS PARAMS: ${dtlsParameters}`);
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].callerId === socket.id && isAudio !== true) {
          await rooms[i].hostConsumerTransport.connect({ dtlsParameters });
        }
        if (rooms[i].callerId === socket.id && isAudio === true) {
          await rooms[i].hostAudioConsumerTransport.connect({ dtlsParameters });
        }
      }
    }
  );

  socket.on(
    "consume-host",
    async ({ rtpCapabilities, audioRtpCapabilities }, callback) => {
      try {
        // check if the router can consume the specified producer
        for (let i = 0; i < rooms.length; i++) {
          if (rooms[i].callerId === socket.id) {
            if (
              rooms[i].router.canConsume({
                producerId: rooms[i].clientProducer.id,
                rtpCapabilities,
              }) &&
              rooms[i].audioRouter.canConsume({
                producerId: rooms[i].clientAudioProducer.id,
                rtpCapabilities: audioRtpCapabilities,
              })
            ) {
              //   // transport can now consume and return a consumer
              let consumer = await rooms[i].hostConsumerTransport.consume({
                producerId: rooms[i].clientProducer.id,
                rtpCapabilities,
                paused: true,
              });

              let audConsumer = await rooms[
                i
              ].hostAudioConsumerTransport.consume({
                producerId: rooms[i].clientAudioProducer.id,
                rtpCapabilities: audioRtpCapabilities,
                paused: true,
              });

              consumer.on("transportclose", () => {
                console.log("transport close from consumer");
              });

              consumer.on("producerclose", () => {
                console.log("producer of consumer closed");
              });

              rooms[i].hostConsumer = consumer;
              rooms[i].hostAudioConsumer = audConsumer;

              //   // from the consumer extract the following params
              //   // to send back to the Client
              const params = {
                id: rooms[i].hostConsumer.id,
                producerId: rooms[i].clientProducer.id,
                kind: rooms[i].hostConsumer.kind,
                rtpParameters: rooms[i].hostConsumer.rtpParameters,
              };
              const params2 = {
                id: rooms[i].hostAudioConsumer.id,
                producerId: rooms[i].clientAudioProducer.id,
                kind: rooms[i].hostAudioConsumer.kind,
                rtpParameters: rooms[i].hostAudioConsumer.rtpParameters,
              };

              //   // send the parameters to the client
              callback({ params, params2 });
            }
          }
        }
      } catch (error) {
        console.log(error.message);
        callback({
          params: {
            error: error,
          },
        });
      }
    }
  );

  socket.on("consumer-resume-host", async () => {
    console.log("consumer host resume");
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].callerId === socket.id) {
        await rooms[i].hostConsumer.resume();
        await rooms[i].hostAudioConsumer.resume();
      }
    }
  });
  socket.on("retryRtcConnectionServerSide", async (data) => {
    console.log("retry request server side");
    data.from = data.from || socket.id;
    socket.to(data.to).emit("reloadServerCall", data);
  });
  socket.on("resetServerState", async (data) => {
    console.log("state reset");
    data.from = data.from || socket.id;

    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].callerId === data.to || rooms[i].answerId === data.to) {
        rooms.splice(i, 1);
      }
    }
    socket.to(data.to).emit("restartServerExg", data);
  });
});

// io.compress(true);

server.listen(PORT, () =>
  console.log(`My server is actively running on port ${PORT}`)
);
// }

// main();
