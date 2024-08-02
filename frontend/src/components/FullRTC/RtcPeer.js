// "use client";
// // import { socket } from "@/Socket";
// import styles from "./FullRtc.module.scss";
// // import AgoraRTM from 'agora-rtm-sdk';
// // import AgoraRTC from 'agora-rtc-react'
// import { useEffect, useState, useRef } from "react";
// import Peer from "simple-peer";
// // get io object from socket.io
// import io from "socket.io-client";
// //the adapter makes web rtc play better across browsers
// import adapter from "webrtc-adapter";

// const RtcPeer = () => {
//   const [me, setMe] = useState("");

//   let client; // client that logs in and has access to functions
//   let channel; //allow send message over channel

//   let localStream; //local video
//   let remoteStream; // other user video
//   let peerConnection;
//   // const connectionRef = useRef(null); //connection allows disconnect when endCall true

//   const servers = {
//     iceServers: [
//       {
//         urls: [
//           "stun:stun1.l.google.com:19302",
//           "stun:stun2.l.google.com:19302",
//         ],
//       },
//     ],
//   };

//   const [stream, setStream] = useState(null); //video stream
//   // const [offerCreated, setOfferCreated] = useState(false); //set offer state
//   // const [socketID, setSocketID] = useState(""); //set offer state

//   // const appName = "psymax";

//   //disconnect client from socket.io server before closing webpage

//   //run on page mount
//   // useEffect(() => {
//   //   const socket = io.connect("http://localhost:4000");

//   //   socket.emit('create', 'room1');
//   //   window.addEventListener("beforeunload", () => {
//   //     socket.disconnect();
//   //     connectionRef.current.destroy();
//   //   });

//   //   socket.on("connect_error", (error) => {
//   //     console.error("Error connecting to server:", error);
//   //   });

//   //   //handle event when new user joins
//   //   socket.on("newUserJoined", (data) => {
//   //     console.log(`New user joined: ${data.userId}`);
//   //     // createOffer(data.userId); // Create offer for the new user
//   //     setSocketID(data.userId)
//   //     console.log(data.userId);

//   //     // hi(data.userId);
//   //   });

//   //   const hi = async (data)=>{
//   //     await data
//   //     console.log(data);
//   //   }

//   //   socket.on("incomingMessage", (data) => {
//   //     console.log(data);
//   //     // Handle incoming messages from other peers
//   //   });

//   //   //recieving peer
//   //   // const peer = new Peer({
//   //   //   initiator: false,
//   //   //   trickle: false,
//   //   //   stream: stream,
//   //   // });

//   //   // Signal handler for sending messages to other peers
//   //   // peer.on("signal", (data) => {
//   //   //   console.log("peer connected")
//   //   //   socket.emit("sendMessage", { recipientId: socketID, message: data });
//   //   // socket.emit("sendMessage", "hello");

//   //   // });

//   //   // Handle incoming messages from other peers
//   //   socket.on("incomingMessage", (data) => {
//   //     console.log(data.senderId, data.message);
//   //     // Process incoming messages from other peers
//   //   });

//   //   // connectionRef.current = peer;

//   //   navigator.mediaDevices
//   //     .getUserMedia({ video: true, audio: false })
//   //     .then((stream) => {
//   //       setStream(stream);
//   //       if(stream)
//   //     });
//   // }, []);

//   // useEffect(() => {
//   const init = async () => {
//     // if (typeof window !== 'undefined')
//     localStream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: false,
//     });
//     document.getElementById("user1").srcObject = localStream;
//     createOffer();
//   };
//   init();

//   // }, []);

//   // useEffect(() => {
//   //   if (stream && !offerCreated) {
//   //     createOffer(socketID);
//   //     setOfferCreated(true); // Set offerCreated flag to true after creating the offer
//   //   }
//   // }, [stream, offerCreated]);

//   // let handleUserJoined = async (peerID) => {
//   //   console.log("A new user joined the channel: ", peerID);
//   // };

//   let createOffer = async () => {
//     peerConnection = new RTCPeerConnection();

//     remoteStream = new MediaStream();
//     document.getElementById("user2").srcObject = remoteStream;

//     if (stream) {
//       stream.getTracks().forEach((track) => {
//         peerConnection.addTrack(track, stream);
//       });
//     }

//     peerConnection.ontrack = (event) => {
//       console.log("got tracl")
//       event.streams[0].getTracks().forEach((track) => {
//         remoteStream.addTrack(track);
//       });
//     };

//     peerConnection.onicecandidate = async (event) => {
//       if (event.candidate) {
//         console.log("new ice candidate:", event.candidate);
//       }
//     };

//     let offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);

//     console.log("offer:", offer);
//     console.log("hi")
//   };

//   return (
//     <div id="videos">
//       <h1 className="text-center text-bold">hi</h1>

//       <video
//         className={styles.videoPlayer}
//         id="user1"
//         // ref={localStream}
//         autoPlay
//         playsInline
//       ></video>

//       <video
//         className={styles.videoPlayer}
//         id="user2"
//         autoPlay
//         playsInline
//       ></video>
//     </div>
//   );
// };

// export { RtcPeer };
