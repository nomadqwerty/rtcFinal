// "use client";

// import { Button } from "react-bootstrap";
// import { useEffect, useState, useRef } from "react";
// import { CopyToClipboard } from "react-copy-to-clipboard";
// import Peer from "simple-peer";
// import io  from "socket.io-client";
// import { InputGroup, Form } from "react-bootstrap";

// import "./homepage.css"
// // import styles from "./homepage.module.scss";

// // const socket = io.connect("http://localhost:4000");

// const HomePage = () => {
//   const [me, setMe] = useState("");
//   const [stream, setStream] = useState();
//   const [receivingCall, setReceivingCall] = useState(false);
//   const [caller, setCaller] = useState("");
//   const [callerSignal, setCallerSignal] = useState();
//   const [callAccepted, setCallAccepted] = useState(false);
//   const [idToCall, setIdToCall] = useState("");
//   const [callEnded, setCallEnded] = useState(false);
//   const [name, setName] = useState("");


//   const appName = "psymax"
//   const myVideo = useRef(null); //my video
//   const userVideo = useRef(null); // other user video
//   const connectionRef = useRef(null); //connection allows disconnect when endCall true

//   //useEffect to prompt audio and video usage
//   //useEffect sets states page load
//   useEffect(() => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         setStream(stream);
//         // if (myVideo.current) {
//         //     myVideo.current.srcObject = stream;
//         //   } else {
//         //     console.error("myVideo.current is undefined");
//         //   }
//         // // console.log(myVideo.current);
//         myVideo.current.srcObject =  stream; //sets useref of myVideo to stream
//       });
      
//       socket.on("connect", () => {
//         console.log("Connected to server");

//         setReceivingCall(true); //setReceivingCall to true
//       setCaller(data.from); //who is calling
//       setName(data.name); //name of who is calling
//       setCallerSignal(data.signal);
//       });
  
//       socket.on("connect_error", (error) => {
//         console.error("Error connecting to server:", error);
//       });
//     // me is emitted from socket.id in backend server.js & we setMe(me)
//     socket.on("me", (id) => {
//       setMe(id);
//       console.log("frontend id is" +id)
//     });


//     // when calluser is true, we pass the data adn set dependent states
//     socket.on("callUser", (data) => {
//       setReceivingCall(true); //setReceivingCall to true
//       setCaller(data.from); //who is calling
//       setName(data.name); //name of who is calling
//       setCallerSignal(data.signal);
//     });
//   }, []);

//   // call user function
//   const callUser = (id) => {
//     const peer = new Peer({
//       initiator: true,
//       trickle: false,
//       stream: stream,
//     });

//     peer.on("signal", (data) => {
//       socket.emit("callUser", {
//         userToCall: id,
//         signalData: data,
//         from: me,
//         name: name,
//       });
//     });

// //set video stream
//     peer.on("stream", (stream) => {
//       userVideo.current.srcObject = stream; //other user video
//     });

//     //call accepted socket
//     socket.on("callAccepted", (signal) => {
//       setCallAccepted(true);
//       peer.signal(signal);
//     });

//     connectionRef.current = peer;

//   };

//   const answerCall =() =>  {
//     setCallAccepted(true)
//     const peer = new Peer({
//         initiator: false,
//         trickle: false,
//         stream: stream
//     })
//     peer.on("signal", (data) => {
//         socket.emit("answerCall", { signal: data, to: caller })
//     })
//     peer.on("stream", (stream) => {
//         userVideo.current.srcObject = stream //set otheruser video
//     })

//     peer.signal(callerSignal)
//     connectionRef.current = peer //set connection ref to enable leaveCall
// }

// const leaveCall = () => {
//     setCallEnded(true)
//     connectionRef.current.destroy()
// }

//   return (
//     <>
// 			<h1 style={{ textAlign: "center", color: '#fff' }}>{appName}</h1>
// 		<div className="container">
// 			<div className="video-container">
// 				<div className="video">
// 					{stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
// 				</div>
// 				<div className="video">
// 					{callAccepted && !callEnded ?
// 					<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
// 					null}
// 				</div>
// 			</div>
// 			<div className="myId">
// 				<input
//                 // type="textarea"
// 					id="filled-basic"
// 					label="Name"
//                     placeholder="name"
// 					// variant="filled"
// 					value={name}
// 					onChange={(e) => setName(e.target.value)}
// 					style={{ marginBottom: "20px" }}
// 				/>
// 				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
// 					<Button variant="outline-dark" color="primary" 
//                     //  startIcon={<AssignmentIcon fontSize="large" />}
//                      >
// 					<i className="bi bi-journal-text"></i>	Copy ID
// 					</Button>
// 				</CopyToClipboard>


// 				<input
//                 // type="textarea"
// 					id="filled-basic"
// 					label="ID to call"
//                     placeholder="id to call"
// 					// variant="filled"
// 					value={idToCall}
// 					onChange={(e) => setIdToCall(e.target.value)}
// 				/>
// 				<div className="call-button">
// 					{callAccepted && !callEnded ? (
// 						<Button variant="contained" color="secondary" onClick={leaveCall}>
// 							End Call
// 						</Button>
// 					) : (
// 						<Button  color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
//                             <i className="bi bi-telephone-fill"></i>
// 						</Button>
// 					)}
// 					{idToCall}
// 				</div>
// 			</div>
// 			<div>
// 				{receivingCall && !callAccepted ? (
// 						<div className="caller">
// 						<h1 >{name} is calling...</h1>
// 						<Button variant="outline-light" color="primary" onClick={answerCall}>
// 							Answer
// 						</Button>
// 					</div>
// 				) : null}
// 			</div>
// 		</div>
// 		</>
//   );
// };

// export default HomePage;

