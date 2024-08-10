"use client";
// import styles from "./FullRtc.module.scss";
import "./fullrtc.css";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Row, Col } from "react-bootstrap";
import Settings from "../Settings/Settings";
import { Device } from "mediasoup-client";
import { useDevices } from "@/utils/DeviceContext";
// import Link from "next/link";
let remoteSkId;
let peerConn;

let params = {
  // mediasoup params
  encodings: [
    {
      rid: "r0",
      maxBitrate: 100000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r1",
      maxBitrate: 300000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r2",
      maxBitrate: 900000,
      scalabilityMode: "S1T3",
    },
  ],
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
  codecOptions: {
    videoGoogleStartBitrate: 1000,
  },
};
let paramsAud = {
  // mediasoup params
  encodings: [],
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
  codecOptions: {
    videoGoogleStartBitrate: 1000,
  },
};

const FullRtc = () => {
  const router = useRouter();
  const [msRoom, setMsRoom] = useState(null);
  const [videoParams, setVideoParams] = useState(null);
  const [audioParams, setAudioParams] = useState(null);
  const [rtpCapabilities, setRtpCapabilities] = useState(null);
  const [audioRtpCapabilities, setAudioRtpCapabilities] = useState(null);
  const [device, setDevice] = useState(null);
  const [audioDevice, setAudioDevice] = useState(null);
  const [deviceAlt, setDeviceAlt] = useState(null);
  const [audioDeviceAlt, setAudioDeviceAlt] = useState(null);
  const [canproduce, setCanProduce] = useState(null);
  const [clientProduce, setClientProduce] = useState(null);
  const [canConsume, setCanConsume] = useState(null);
  const [canHostConsume, setCanHostConsume] = useState(null);
  const [connectConsume, setConnectConsume] = useState(null);
  const [connectHostConsume, setConnectHostConsume] = useState(null);
  const [producerTransport, setProducerTransport] = useState(null);
  const [audioProducerTransport, setAudioProducerTransport] = useState(null);
  const [consumerTransport, setConsumerTransport] = useState(null);
  const [audioConsumerTransport, setAudioConsumerTransport] = useState(null);
  const [producer, setProducer] = useState(null);
  const [audioProducer, setAudioProducer] = useState(null);
  const [clientProducer, setclientProducer] = useState(null);
  const [canClientProduce, setCanClientProduce] = useState(null);
  const [hostStartConsume, setHostStartConsume] = useState(null);

  const [consumer, setConsumer] = useState(null);

  const [stream, setStream] = useState(null); //video stream
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);

  const [offerCreated, setOfferCreated] = useState(false); //set offer state
  const [socketID, setSocketID] = useState(""); //set offer state

  const [roomAccessKey, setRoomAccessKey] = useState(null);
  const [remoteClientName, setremoteClientName] = useState(null);

  //check for media devices
  const [isCameraOn, setIsCameraOn] = useState(null); //camera
  const [isCameraTest, setIsCameraTest] = useState(false); //camera

  const videoTestRef = useRef(null); //child testref

  const [videoTrack, setVideoTrack] = useState(null);

  const [isMicOn, setIsMicOn] = useState(null); //audio
  const [isMicTest, setIsMicTest] = useState(false); // is audio test on?
  const micTestRef = useRef(null); // microphone child test ref?

  const [isSpeakerOn, setIsSpeakerOn] = useState(null); //audio
  const [isSpeakerTest, setIsSpeakerTest] = useState(false); // is audio test on?

  //user changed devices tracker
  const [localDeviceChanged, setLocalDeviceChanged] = useState(false);
  const [remoteDeviceChanged, setRemoteDeviceChanged] = useState(false);

  // Fetch available devices from usecontext usedevices
  const {
    devices,
    selectedAudio,
    setSelectedAudio,
    selectedVideo,
    setSelectedVideo,
    selectedOutput,
    setSelectedOutput,
  } = useDevices();

  //function to update stream
  const updateStream = async (audioDeviceId, videoDeviceId, outputDeviceId) => {
    try {
      // alert current peer of impossible device update due to remote user haven changed theirs already
      if (remoteDeviceChanged) {
        window.alert(
          //english translation
          // `Sorry, only ${remoteClientName} can update their devices at this time.`

          `Sorry, alleen ${remoteClientName} kan hun apparaten op dit moment updaten.`
        );
        return;
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
        },
        video: {
          deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
        },
      });

      setStream(newStream);
      handleDeviceChange(newStream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }

      if (
        outputDeviceId &&
        audioOutputElement.current &&
        audioOutputElement.current.setSinkId
      ) {
        audioOutputElement.current.setSinkId(outputDeviceId).catch((error) => {
          console.error("Error setting audio output device: ", error);
        });
      }

      // setLocalDeviceChanged(true);
      socketRef.current.emit("deviceChanged", { roomAccessKey });
    } catch (error) {
      console.error("Error updating media stream: ", error);
    }
  };

  // const handleAudioChange = async (event) => {
  //   const newAudioDeviceId = event.target.value;
  //   setSelectedAudio(newAudioDeviceId);
  //   await updateStream(newAudioDeviceId, selectedVideo, selectedOutput);
  // };

  // const handleVideoChange = async (event) => {
  //   const newVideoDeviceId = event.target.value;
  //   setSelectedVideo(newVideoDeviceId);
  //   await updateStream(selectedAudio, newVideoDeviceId, selectedOutput);
  // };

  //function to handle audio change
  const handleAudioChange = async (event) => {
    const newAudioDeviceId = event.target.value;
    setSelectedAudio(newAudioDeviceId);
    await updateStream(newAudioDeviceId, selectedVideo, selectedOutput);
  };

  //fucntion to handle video change
  const handleVideoChange = async (event) => {
    const newVideoDeviceId = event.target.value;
    setSelectedVideo(newVideoDeviceId);
    await updateStream(selectedAudio, newVideoDeviceId, selectedOutput);
  };

  // Update the audio output device
  // const updateAudioOutput = (deviceId) => {
  //   if (audioOutputElement.current && audioOutputElement.current.setSinkId) {
  //     audioOutputElement.current
  //       .setSinkId(deviceId)
  //       .then(() => {
  //         console.log(`Audio output device set to ${deviceId}`);
  //       })
  //       .catch((error) => {
  //         console.error("Error setting audio output device: ", error);
  //       });
  //   } else {
  //     console.warn(
  //       "Audio output device selection is not supported in this browser."
  //     );
  //   }
  // };
  //

  const [screenStream, setScreenStream] = useState(null); // State to store screen stream
  const [isScreenSharing, setIsScreenSharing] = useState(false); // State to track screen sharing status
  const [screenSharingId, setScreenSharingId] = useState(""); // State to track screen sharing status

  const [isSettingsVisible, setIsSettingsVisible] = useState(false); // State to track settings page status

  const [isChatVisible, setIsChatVisible] = useState(false); // State to track chat view status
  const [remoteId, setRemoteId] = useState(false); // State to track chat view status

  const [messages, setMessages] = useState([]); //track messages
  const messagesEndRef = useRef(null); // Ref to track the end of the messages list

  //get time stamp
  const localVideoRef = useRef(null); // Ref for local video element
  const remoteVideoRef = useRef(null); // Ref for remote video element
  const screenShareRef = useRef(null); // Ref for screen share video element
  // let sharedScreenStream;
  const isCameraOnRef = useRef(null);
  const searchParams = useSearchParams();
  const accessKey = searchParams.get("accessKey");
  const localClientName = searchParams.get("clientName");
  //VIDEO APP STATE CONTROLS

  //add video quality
  // let constraints = {
  //   video: {
  //     noiseSuppression: true,
  //     width: { min: 640, ideal: 1920, max: 1920 },
  //     height: { min: 640, ideal: 1920, max: 1920 },
  //   },
  //   audio: {
  //     echoCancellation: true,
  //     noiseSuppression: true,
  //   },
  // };

  const [constraints, setConstraints] = useState({
    video: true,
    audio: true,
  });

  const handleDeviceChange = (newStream) => {
    setStream(newStream);
    // Further processing with the new stream
  };

  //useeffect to set if remoter user changed device
  // useEffect(() => {
  //   if (socketRef.current){

  //     socketRef.current.on("deviceChanged", () => {
  //       setRemoteDeviceChanged(true);
  //     });
  //   }
  // }, []);

  let screenRecordConstraints = {
    video: {
      cursor: "always",
      displaySurface: "application" | "browser" | "monitor" | "window",
    },
  };
  //useeffect to redirect user to lobby if no accesskey is found
  useEffect(() => {
    if (accessKey) {
      setRoomAccessKey(accessKey);
    } else {
      router.push("/lobby");
      // window.location = 'lobby'
    }
  }, [router, accessKey]);

  let peerConnection;
  let socketRef = useRef(null);

  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
  };

  // const appName = "psymax";
  // socket = io("http://localhost:3050");

  //run on page mount

  //handler for when a user joins the server
  const handleUserJoined = async (data) => {
    const { room, userSocketID, remoteName } = data;
    if (socketRef.current && !offerCreated && room === roomAccessKey) {
      socketRef.current.emit("localClientName", localClientName); //emit current local client name when a new socket joins

      setSocketID(socketRef.current.id);
      console.log(
        "user",
        remoteName,
        "with socketID",
        data.userSocketID,
        "joined room",
        room
      );
      console.log(room);

      // setSocketID(data.userSocketID);
      if (!offerCreated && room === roomAccessKey) {
        createOffer(userSocketID); //run create offer function
        setOfferCreated(true);
        handleRemoteName(remoteName);
      }
      try {
        document.getElementById("user2_div").style.display = "block"; //set user2 element display to none when the user/disconnects leaves
      } catch (e) {
        console.log("could not set block", e);
      }
    }
  };

  const handleIncomingMsg = async (data) => {
    try {
      const message = JSON.parse(await data.text);
      const userID = await data.userID;

      if (message.type == "offer") {
        await createAnswer(userID, message.offer);
      } else if (message.type == "answer") {
        await addAnswer(message.answer);
      } else if (message.type == "candidate") {
        setRemoteId(userID);
        if (peerConnection) {
          await peerConnection.addIceCandidate(message.candidate);
        }
      }
      remoteSkId = userID;
      console.log("Incoming msg from:" + userID, message);
    } catch (e) {
      console.log("could not parse incomng msg:", e);
    }

    //     const { senderId, offer } = data;
    // console.log(`Received offer from ${senderId}:`, offer);
  };

  //user leaves server handler
  const handleUserLeft = async (data) => {
    try {
      document.getElementById("user2_div").style.display = "none"; //set user2 element display to none when the user/disconnects leaves
      setOfferCreated(!offerCreated);

      document.getElementById("user1_div").classList.remove("smallFrame"); //set localuser//user1 element display to full view
    } catch (e) {
      console.log("could not set none", e);
    }
    //     const { senderId, offer } = data;
    // console.log(`Received offer from ${senderId}:`, offer);
  };

  //handler for when a socket connects to server
  const handleSocketConnected = async () => {
    socketRef.current.emit("roomAccessKey", {
      roomToJoin: roomAccessKey,
      clientName: localClientName,
    });
    console.log("your socket ID is:", socketRef.current.id); //emit accesskey and local client name once connected

    socketRef.current.emit("localClientName", localClientName); //emit local name on connection
  };

  //handler for when a remoteName event is emitted
  const handleRemoteName = async (data) => {
    const { remoteName } = await data;
    remoteName ? setremoteClientName(remoteName) : null;
  };

  const handleChatMsg = async (data) => {
    const { msg, serverOffset, clientName } = await data;
    console.log(serverOffset, clientName, msg);
    //  let msgWrapper = document.getElementById("messages");

    // Create a new message object
    const newMessage = {
      id: serverOffset, // Assuming serverOffset can be used as a unique identifier
      clientName,
      message: msg,
      time: getTime(),
    };

    try {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    } catch (e) {
      console.log("messages not sent", e);
    }
    // Update messages state with the new message

    window.scrollTo(0, document.body.scrollHeight);
    // socketRef.current.auth.serverOffset = serverOffset;
  };
  useEffect(() => {
    const clientNameEl = document.getElementById("localClientName");

    if (stream) {
      const videoTrack = stream
        .getTracks()
        .find((track) => track.kind === "video");

      setVideoTrack(videoTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      if (videoTrack.enabled && clientNameEl) {
        if (socketRef.current) {
          socketRef.current.emit("remote-camera", {
            roomAccessKey: accessKey,
            cameraState: "on",
          });
        }
      } else {
        if (socketRef.current) {
          socketRef.current.emit("remote-camera", {
            roomAccessKey: accessKey,
            cameraState: "off",
          });
        }
      }
    }
  }, [stream]);

  //get local stream
  useEffect(() => {
    const getLocalStream = async () => {
      try {
        if (roomAccessKey) {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          // .then((stream) => {
          // const videoTracks = stream.getVideoTracks();
          // console.log(videoTracks);
          setStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          // const localVideoEl = document.getElementById("user1");
          // localVideoEl.srcObject = stream;
          // localStream.current.srcObject = stream;
        }
      } catch (error) {
        console.log("Error accessing media devices: ", error);
      }
    };

    getLocalStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // })
  }, [roomAccessKey]);

  useEffect(() => {
    const getLocalStream = async () => {
      try {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop()); // Stop previous tracks
        }
        if (roomAccessKey) {
          const newStream = await navigator.mediaDevices.getUserMedia(
            constraints
          );
          setStream(newStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
          }
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    getLocalStream();
  }, [constraints]);

  //check status of media devices and update control icons accordingly
  useEffect(() => {
    // Function to check camera state and set initial state
    const checkCameraState = async () => {
      if (stream) {
        let videoTrack = stream
          .getTracks()
          .find((track) => track.kind === "video");
        setIsCameraOn(videoTrack.enabled);
        isCameraOnRef.current = videoTrack.enabled; //set camera status useref
      }
      return isCameraOn;
    };

    const checkMicState = async () => {
      if (stream) {
        let audioTrack = stream
          .getTracks()
          .find((track) => track.kind === "audio");
        if (audioTrack) {
          setIsMicOn(audioTrack.enabled);
        }
      }
    };

    // Call the function when component mounts
    checkCameraState();
    checkMicState();
    // checkRemoteVidState();
  }, [stream]);

  const handleRemoteCamera = async (cameraState) => {
    // const checkRemoteVidState = async () => {
    // const remoteEl = document.getElementById('user2');
    const remoteClientNameEl = document.getElementById("remoteClientName"); //get remote client name
    const remoteVideoEl = document.getElementById("user2"); //get remote video element

    //test camera state
    if (cameraState === "off" || false) {
      try {
        remoteVideoEl.style.display = "none";
        remoteVideoRef.current.style.display = "none";
        remoteClientNameEl.style.display = "block";
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        remoteVideoEl.style.display = "block";
        remoteVideoRef.current.style.display = "block";
        remoteClientNameEl.style.display = "none";
      } catch (e) {
        console.log(e);
      }
    }
  };

  //create socket connection & initialise events if !socketconn && stream
  useEffect(() => {
    if (!socketRef.current && stream) {
      socketRef.current = io(process.env.NEXT_PUBLIC_SIGNAL_HOST, {
        transports: ["websocket"],
      }); //create socket instance if noRef and video stream avail

      // socket.emit("hello", "hello from offer UE");
      socketRef.current.on("connect", handleSocketConnected);

      //listen for a new user join event
      socketRef.current.on("newUserJoined", handleUserJoined);

      socketRef.current.on("incomingMsg", handleIncomingMsg);

      socketRef.current.on("userDisconnected", handleUserLeft);

      socketRef.current.on("remoteName", handleRemoteName);

      socketRef.current.on("chat message", handleChatMsg);

      socketRef.current.on("remote-camera", handleRemoteCamera);

      socketRef.current.on("deviceChanged", () => {
        setRemoteDeviceChanged(true);
      });

      // TODO: i am here.
      socketRef.current.on("cosumeMedia", (data) => {
        console.log("setting up recv and consumer...");
        console.log(data);
        peerConn = undefined;
        setCanConsume(data);
      });
      socketRef.current.on("cosumeClientMedia", (data) => {
        console.log("setting up recv and consumer for host...");
        console.log(data);

        setHostStartConsume(data);
      });
      socketRef.current.on("reloadPage", async (data) => {
        console.log("page reload request");
        console.log(data);
        peerConnection = new RTCPeerConnection(servers);
        peerConn = peerConnection;
        if (peerConn) {
          console.log(peerConn);
          stream.getTracks().forEach((track) => {
            peerConn.addTrack(track, stream);
          });
          peerConn.onicecandidate = async (event) => {
            if (event.candidate) {
              // if(socket){

              // if (socketRef.current)
              // socketRef.current.emit("candidate", "hi candidiate")

              socketRef.current.emit("sendMessage", {
                text: JSON.stringify({
                  type: "candidate",
                  candidate: event.candidate,
                }),
                remoteSkId,
                roomAccessKey,
              });
              console.log("new ice answer sent");
            }
          };
          peerConn.ontrack = (e) => {
            remoteVideoRef.current.srcObject = null;
            const remoteStream = new MediaStream();
            remoteVideoRef.current.srcObject = remoteStream;
            console.log("Got a track from the other peer!! How excting");
            console.log(e.streams[0]);
            console.log(e.transceiver);
            let stream1 = e.streams[0];
            console.log(e.streams);
            e.streams[0].onaddtrack = (e) => {
              console.log("added tracks");
            };
            e.streams[0].onremovetrack = (e) => {
              console.log("removed tracks");
            };
            e.transceiver.receiver.track.onmute = (e) => {
              console.log("transceiver.receiver.track.onmute 3");
              console.log("socket with id: ", remoteId);
            };
            e.transceiver.receiver.track.onended = (e) => {
              console.log("transceiver.receiver.track.onended");
            };
            e.transceiver.receiver.track.onunmute = (e) => {
              console.log("transceiver.receiver.track.onunmute");
              if (remoteStream) {
                stream1.getTracks().forEach((track) => {
                  console.log(track);
                  remoteStream.addTrack(track, remoteStream);
                  console.log("Here's an exciting moment peerConn");
                });
              }
            };
          };
          await peerConn.setRemoteDescription(data.offer);
          let answer = await peerConn.createAnswer();
          await peerConn.setLocalDescription(answer);
          console.log("new answer");
          console.log(answer, data);
          console.log(data);
          data.answer = answer;
          console.log(socketRef.current.id, remoteId, remoteSkId);
          socketRef.current.emit("createdNewAnswer", {
            from: socketRef.current.id,
            to: remoteSkId,
            answer: answer,
            offer: data.offer,
          });
        }
        // window.location.reload();
      });

      socketRef.current.on("reloadServerCall", (data) => {
        console.log(data);
        console.log("reload server");

        setMsRoom(null);
        setVideoParams(null);
        setAudioParams(null);
        setRtpCapabilities(null);
        setAudioRtpCapabilities(null);
        setDevice(null);
        setAudioDevice(null);
        setDeviceAlt(null);
        setAudioDeviceAlt(null);
        setCanProduce(null);
        setClientProduce(null);
        setCanConsume(null);
        setCanHostConsume(null);
        setConnectConsume(null);
        setConnectHostConsume(null);
        setProducerTransport(null);
        setAudioProducerTransport(null);
        setConsumerTransport(null);
        setAudioConsumerTransport(null);
        setProducer(null);
        setAudioProducer(null);
        setclientProducer(null);
        setCanClientProduce(null);
        setHostStartConsume(null);
        setConsumer(null);

        socketRef.current.emit("resetServerState", {
          from: socketID,
          to: data.from,
        });
      });

      // restart call;
      socketRef.current.on("restartServerExg", (data) => {
        console.log(data);

        setMsRoom(null);
        setVideoParams(null);
        setAudioParams(null);
        setRtpCapabilities(null);
        setAudioRtpCapabilities(null);
        setDevice(null);
        setAudioDevice(null);
        setDeviceAlt(null);
        setAudioDeviceAlt(null);
        setCanProduce(null);
        setClientProduce(null);
        setCanConsume(null);
        setCanHostConsume(null);
        setConnectConsume(null);
        setConnectHostConsume(null);
        setProducerTransport(null);
        setAudioProducerTransport(null);
        setConsumerTransport(null);
        setAudioConsumerTransport(null);
        setProducer(null);
        setAudioProducer(null);
        setclientProducer(null);
        setCanClientProduce(null);
        setHostStartConsume(null);
        setConsumer(null);

        setTimeout(() => {
          socketRef.current.emit("createRoom", (data) => {
            console.log(data);
            setMsRoom(data.room);
            setRtpCapabilities(data.rtpCapabilities);
            setAudioRtpCapabilities(data.audioRtpCapabilities);
          });
        }, 1000);
      });

      socketRef.current.on("reloadComplete", async (data) => {
        console.log("page reload completed");
        console.log(peerConn.signalingState);
        console.log(peerConnection.signalingState);
        if (peerConn) {
          console.log(data);
          await peerConn.setRemoteDescription(data.answer);
          console.log("set answer");
        }
        // window.location.reload();
      });
      let leaveChannel = async () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current.off("newUserJoined", handleUserJoined);
          socketRef.current.off("incomingMsg", handleIncomingMsg);
          socketRef.current.off("userDisconnected", handleUserLeft);
          socketRef.current.off("connect", handleSocketConnected);
          socketRef.current.off("remoteName", handleRemoteName);
          socketRef.current.off("chat message", handleChatMsg);
          socketRef.current.off("remote-camera", handleRemoteCamera);

          socketRef.current = null;
        }
      };
      window.addEventListener("beforeunload", leaveChannel);

      return () => {
        leaveChannel();
      };
    }
  }, [stream]);

  // useEffect(() => {
  //   if (socketRef.current){
  //     socketRef.current.on("chat message", handleChatMsg);
  //   }

  //   let leaveChannel = async () => {
  //     if (socketRef.current) {
  //       socketRef.current.off("chat message", handleChatMsg);

  //       socketRef.current = null;
  //     }
  //   };
  //   window.addEventListener("beforeunload", leaveChannel);

  //   return () => {
  //     leaveChannel();
  //   };

  // }, [messages]);

  let createPeerConnection = async (userID) => {
    peerConnection = new RTCPeerConnection(servers);
    peerConn = peerConnection; //passed ice servers into connection
    const remoteStream = new MediaStream();
    remoteVideoRef.current.srcObject = remoteStream; //set remote elemt srcobject to remotestream
    console.log(remoteVideoRef.current.srcObject.getAudioTracks());
    setRemoteStream(remoteStream);

    document.getElementById("user2_div").style.display = "block"; //set user2 element display to true when the user connects

    //  remoteVideoRef.current.style.display = "block";

    document.getElementById("user1_div").classList.add("smallFrame"); //add smallframe to user1 div on peer connection

    //get stream and set localvideoref
    if (!stream) {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(stream);
      localVideoRef.current.srcObject = stream;
    }

    // check for local tracks and add to the peer connection if exist
    if (stream) {
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
    }

    //emit camerastate of peer when peer connection is being established
    if (socketRef.current) {
      let videoTrack = stream
        .getTracks()
        .find((track) => track.kind === "video"); //get video tracks

      if (videoTrack.enabled) {
        socketRef.current.emit("remote-camera", {
          roomAccessKey: accessKey,
          cameraState: "on",
        });
      } else {
        socketRef.current.emit("remote-camera", {
          roomAccessKey: accessKey,
          cameraState: "off",
        });
      }
    }
    // if (!screenStream) {
    //      const stream = await navigator.mediaDevices.getDisplayMedia(
    //       screenRecordConstraints
    //     );
    //   stream.getTracks().forEach((track) => {
    //     peerConnection.addTrack(track, stream);
    //   });
    // }

    //add remote peer tracks on remote track added
    peerConn.ontrack = (e) => {
      remoteVideoRef.current.srcObject = null;
      const remoteStream = new MediaStream();
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("Got a track from the other peer!! How excting");
      console.log(e.streams[0]);
      console.log(e.transceiver);

      let stream1 = e.streams[0];
      console.log(e.streams);
      e.streams[0].onaddtrack = (e) => {
        console.log("added tracks");
      };
      e.streams[0].onremovetrack = (e) => {
        console.log("removed tracks");
      };
      e.transceiver.receiver.track.onmute = (e) => {
        console.log("transceiver.receiver.track.onmute 1");
        console.log("socket with id: ", remoteId);
      };
      e.transceiver.receiver.track.onended = (e) => {
        console.log("transceiver.receiver.track.onended");
      };
      e.transceiver.receiver.track.onunmute = (e) => {
        console.log("transceiver.receiver.track.onunmute");
        if (remoteStream) {
          stream1.getTracks().forEach((track) => {
            console.log(track);
            remoteStream.addTrack(track, remoteStream);
            console.log("Here's an exciting moment... fingers cross");
          });
        }
      };
    };

    //check for ICE candidate
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          socketRef.current.emit("sendMessage", {
            text: JSON.stringify({
              type: "candidate",
              candidate: event.candidate,
            }),
            userID,
            roomAccessKey,
          });
          console.log("ice sent");
        } catch (error) {
          console.error("Error sending ICE candidate:", error);
        }
      }
    };
  };

  //create sdp offer function
  let createOffer = async (userID) => {
    await createPeerConnection(userID);
    //create offer
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log(offer);
    // send message of reciving user && SDP offer to server on createOffer()
    if (socketRef.current)
      socketRef.current.emit("sendMessage", {
        text: JSON.stringify({ type: "offer", offer: offer }),
        userID,
        roomAccessKey,
      });
  };

  //create answer to offer from recieivng peer // newly joined peer
  let createAnswer = async (userID, offer) => {
    await createPeerConnection(userID);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (socketRef.current)
      socketRef.current.emit("sendMessage", {
        text: JSON.stringify({ type: "answer", answer: answer }),
        userID,
        roomAccessKey,
      });
  };

  //peer1 add asnwer after offer has been sent & returned
  let addAnswer = async (answer) => {
    if (
      !peerConnection.remoteDescription &&
      peerConnection.remoteDescription === null
    ) {
      await peerConnection.setRemoteDescription(answer);
    }
  };

  // user camera toggler
  let toggleCamera = async () => {
    const clientNameEl = document.getElementById("localClientName"); //get client name element
    let videoTrack = stream.getTracks().find((track) => track.kind === "video"); //get video tracks
    setVideoTrack(videoTrack);

    // disable videotrack if enabled and display clientName
    if (videoTrack.enabled && clientNameEl) {
      videoTrack.enabled = false;
      isCameraOnRef.current = videoTrack.enabled;
      localVideoRef.current.style.display = "none";
      clientNameEl.style.display = "block";
      setIsCameraOn(false); // Toggle the state
      console.log("is camera on vidtrack", videoTrack.enabled);

      if (socketRef.current) {
        socketRef.current.emit("remote-camera", {
          roomAccessKey: accessKey,
          cameraState: "off",
        });
      }
    }
    // enable videotrack if disabled and hide clientName
    else {
      videoTrack.enabled = true;
      localVideoRef.current.style.display = "block";
      clientNameEl.style.display = "none";

      setIsCameraOn(true);
      console.log("is camera on vidtrack", videoTrack.enabled);
      if (socketRef.current) {
        socketRef.current.emit("remote-camera", {
          roomAccessKey: accessKey,
          cameraState: "on",
        });
      }
    }
    // Call the getVideoTestOutput method from the child component
    if (videoTestRef.current && isCameraTest) {
      videoTestRef.current.getVideoTestOutput();
    }
  };

  //user mic toggler
  let toggleMic = async () => {
    let audioTrack = stream.getTracks().find((track) => track.kind === "audio");

    if (audioTrack && audioTrack.enabled) {
      audioTrack.enabled = false;
      setIsMicOn(false); // Toggle the state
    } else {
      audioTrack.enabled = true;
      setIsMicOn(true);
    }
  };

  //get localuser current time stamp
  let getTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  let toggleSettings = async () => {
    // if(!isChatVisible){
    //   setIsSettingsVisible(false);
    //   settingsEl.style.width = "0%";
    //   settingsEl.style.display = "none";
    //   membersVideoContainer.style.width = "100%";
    // }

    const messagesContainer = document.getElementById("component_wrapper");
    const membersVideoContainer = document.getElementById("members_container");
    // const input = document.getElementById("msgInput");
    const settingsContainer = document.getElementById("settings-wrapper");
    const chatContainer = document.getElementById("chat-container");

    if (!isSettingsVisible && !isChatVisible) {
      try {
        membersVideoContainer.style.width = "75%";

        // Add event listener for transitionend event
        membersVideoContainer.addEventListener(
          "transitionend",
          () => {
            // Render the chat component contents after width adjustment is completed
            messagesContainer.style.width = "25%";
            messagesContainer.style.display = "block";
            if (settingsContainer) {
              settingsContainer.style.display = "block";
              setIsSettingsVisible(true);
            }
          },
          { once: true }
        ); // Ensure the event listener is removed after firing once
      } catch (e) {
        console.log("could not set settings visible", e);
      }
    } else if (isChatVisible && !isSettingsVisible) {
      setIsChatVisible(false);
      chatContainer.style.display = "none";

      setIsSettingsVisible(true);
      settingsContainer.style.display = "block";

      // toggleChat();
    } else {
      try {
        messagesContainer.style.width = "0%";
        messagesContainer.style.display = "none";
        membersVideoContainer.style.width = "100%";

        setIsSettingsVisible(false);
        setIsChatVisible(false);
        if (settingsContainer) {
          settingsContainer.style.display = "none";
        }

        if (chatContainer) {
          chatContainer.style.display = "none";
        }
      } catch (e) {
        console.log("could not set settings not-visible", e);
      }
    }
  };

  let leaveCall = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // Stop previous tracks
    }
    router.push("/lobby");
  };

  // TODO: imporove this
  const restartCall = async () => {
    if (peerConn && msRoom === null) {
      console.log("retrying connection");
      peerConn.onnegotiationneeded = async () => {
        console.log("negotiate");
        peerConnection = new RTCPeerConnection(servers);
        peerConn = peerConnection;
        stream.getTracks().forEach((track) => {
          peerConn.addTrack(track, stream);
        });

        peerConn.onicecandidate = async (event) => {
          if (event.candidate) {
            // if(socket){

            // if (socketRef.current)
            // socketRef.current.emit("candidate", "hi candidiate")

            socketRef.current.emit("sendMessage", {
              text: JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
              }),
              remoteSkId,
              roomAccessKey,
            });
            console.log("new ice sent");
          }
        };
        peerConn.ontrack = (e) => {
          remoteVideoRef.current.srcObject = null;
          const remoteStream = new MediaStream();
          remoteVideoRef.current.srcObject = remoteStream;
          console.log("Got a track from the other peer!! How excting");
          console.log(e.streams[0]);
          console.log(e.transceiver);
          let stream1 = e.streams[0];
          console.log(e.streams);
          e.streams[0].onaddtrack = (e) => {
            console.log("added tracks");
          };
          e.streams[0].onremovetrack = (e) => {
            console.log("removed tracks");
          };
          e.transceiver.receiver.track.onmute = (e) => {
            console.log("transceiver.receiver.track.onmute 2");
            console.log("socket with id: ", remoteId);
          };
          e.transceiver.receiver.track.onended = (e) => {
            console.log("transceiver.receiver.track.onended");
          };
          e.transceiver.receiver.track.onunmute = (e) => {
            console.log("transceiver.receiver.track.onunmute");
            if (remoteStream) {
              stream1.getTracks().forEach((track) => {
                console.log(track);
                remoteStream.addTrack(track, remoteStream);
                console.log("Here's an exciting moment peerConn");
              });
            }
          };
        };
        let offerSdp = await peerConnection.createOffer();
        peerConn.setLocalDescription(offerSdp);
        console.log(offerSdp);

        socketRef.current.emit("retryRtcConnection", {
          from: socketID,
          to: remoteId,
          offer: offerSdp,
        });
      };
      peerConn.restartIce();
    } else {
      console.log(msRoom);

      setTimeout(() => {
        socketRef.current.emit("retryRtcConnectionServerSide", {
          from: socketID,
          to: remoteId,
        });
      }, 1000);
    }
  };

  // TODO: media soup
  const restartFullCall = async () => {
    console.log("room");
    if (msRoom === null) {
      peerConn = undefined;
      socketRef.current.emit("createRoom", (data) => {
        console.log(data);
        setMsRoom(data.room);
        setRtpCapabilities(data.rtpCapabilities);
        setAudioRtpCapabilities(data.audioRtpCapabilities);
      });
    }
  };

  useEffect(() => {
    if (rtpCapabilities && audioRtpCapabilities && msRoom) {
      console.log(msRoom, "room");
      const track = stream.getVideoTracks()[0];
      const sound = stream.getAudioTracks()[0];
      const vidParams = {
        track: track,
        ...params,
      };
      const audParams = {
        track: sound,
        ...paramsAud,
      };
      const localVideo = document.getElementById("user1");
      localVideo.srcObject = null;
      setVideoParams(vidParams);
      setAudioParams(audParams);
    }
  }, [rtpCapabilities, audioRtpCapabilities]);

  // FIXME:
  useEffect(() => {
    if (videoParams && audioParams && msRoom) {
      console.log(videoParams);
      console.log(audioParams);
      if (rtpCapabilities && audioRtpCapabilities) {
        (async () => {
          const newDevice = new Device();
          await newDevice.load({
            // see getRtpCapabilities() below
            routerRtpCapabilities: rtpCapabilities,
          });
          const newAudioDevice = new Device();
          await newAudioDevice.load({
            // see getRtpCapabilities() below
            routerRtpCapabilities: audioRtpCapabilities,
          });
          setDevice(newDevice);
          setAudioDevice(newAudioDevice);
        })();
      }
    }
  }, [videoParams, audioParams]);
  useEffect(() => {
    if (device && audioDevice && msRoom) {
      if (device && audioDevice) {
        console.log("device");
        console.log(device.rtpCapabilities);
        console.log(audioDevice.rtpCapabilities);
        socketRef.current.emit(
          "createWebRtcTransport",
          { sender: true },
          ({ params, params2 }) => {
            // The server sends back params needed
            // to create Send Transport on the client side
            if (params.error) {
              console.log(params.error);
              return;
            }
            if (params2.error) {
              console.log(params2.error);
              return;
            }

            console.log(params);
            console.log(params2);

            const producerTransport = device.createSendTransport(params);
            const audioProducerTransport =
              audioDevice.createSendTransport(params2);

            setProducerTransport(producerTransport);
            setAudioProducerTransport(audioProducerTransport);
          }
        );
      }
    }
  }, [device, audioDevice]);

  useEffect(() => {
    if (producerTransport && audioProducerTransport && msRoom) {
      console.log(producerTransport);
      console.log(audioProducerTransport);
      producerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-connect', ...)
            await socketRef.current.emit("transport-connect", {
              dtlsParameters,
              msRoom,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            errback(error);
          }
        }
      );
      audioProducerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-connect', ...)
            await socketRef.current.emit("transport-connect", {
              dtlsParameters,
              msRoom,
              isAudio: true,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            errback(error);
          }
        }
      );

      producerTransport.on("produce", async (parameters, callback, errback) => {
        console.log(parameters.kind);

        try {
          // tell the server to create a Producer
          // with the following parameters and produce
          // and expect back a server side producer id
          // see server's socketRef.current.on('transport-produce', ...)
          await socketRef.current.emit(
            "transport-produce",
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
              msRoom,
            },
            ({ id }) => {
              // Tell the transport that parameters were transmitted and provide it with the
              // server side producer's id.
              console.log(id);
              callback({ id });
            }
          );
        } catch (error) {
          errback(error);
        }
      });
      audioProducerTransport.on(
        "produce",
        async (parameters, callback, errback) => {
          console.log(parameters.kind);

          try {
            // tell the server to create a Producer
            // with the following parameters and produce
            // and expect back a server side producer id
            // see server's socketRef.current.on('transport-produce', ...)

            await socketRef.current.emit(
              "transport-produce",
              {
                kind: parameters.kind,
                rtpParameters: parameters.rtpParameters,
                appData: parameters.appData,
                msRoom,
                isAudio: true,
              },
              ({ id }) => {
                // Tell the transport that parameters were transmitted and provide it with the
                // server side producer's id.
                console.log(id);
                callback({ id });
              }
            );
          } catch (error) {
            errback(error);
          }
        }
      );

      setCanProduce(true);
    }
  }, [producerTransport, audioProducerTransport]);

  useEffect(() => {
    if (canproduce && msRoom) {
      (async () => {
        let vidProd = await producerTransport.produce(videoParams);
        let audProd = await audioProducerTransport.produce(audioParams);

        vidProd.on("trackended", () => {
          console.log("track ended");

          // close video track
        });

        vidProd.on("transportclose", () => {
          console.log("transport ended");

          // close video track
        });

        audProd.on("trackended", () => {
          console.log("audio track ended");

          // close video track
        });

        audProd.on("transportclose", () => {
          console.log("audio transport ended");

          // close video track
        });

        setProducer(vidProd);
        setAudioProducer(audProd);
        // let audProd = await producerTransport.produce(audioParams);
        // console.log(audProd);
        // setAudioProducer(audProd);
      })();
    }
  }, [canproduce]);

  useEffect(() => {
    if (producer && audioProducer && msRoom) {
      console.log(producer);
      console.log(audioProducer);
      const localVideo = document.getElementById("user1");
      localVideo.srcObject = stream;
      socketRef.current.emit("remoteConsume", {
        from: socketRef.current.id,
        to: remoteId,
      });
    }
  }, [producer, audioProducer]);

  // Consumer
  // TODO: media soup
  useEffect(() => {
    if (canConsume?.from) {
      const remoteVideo = document.getElementById("user2");
      remoteVideo.srcObject = remoteStream;
      socketRef.current.emit("joinRoom", canConsume, (data) => {
        console.log(data);
        setMsRoom(data.room);
        setRtpCapabilities(data.rtpCapabilities);
        setAudioRtpCapabilities(data.audioRtpCapabilities);
      });
    }
  }, [canConsume]);
  useEffect(() => {
    if (
      rtpCapabilities &&
      audioRtpCapabilities &&
      msRoom === false &&
      canConsume?.from
    ) {
      (async () => {
        const newDevice = new Device();
        await newDevice.load({
          // see getRtpCapabilities() below
          routerRtpCapabilities: rtpCapabilities,
        });
        setDevice(newDevice);

        const newAudioDevice = new Device();
        await newAudioDevice.load({
          // see getRtpCapabilities() below
          routerRtpCapabilities: audioRtpCapabilities,
        });
        setAudioDevice(newAudioDevice);
      })();
    }
  }, [rtpCapabilities, audioRtpCapabilities]);

  // FIXME:
  useEffect(() => {
    if (device && audioDevice && msRoom === false && canConsume?.from) {
      console.log(device);
      console.log("device");
      console.log(audioDevice);
      console.log("audio device");
      console.log(device.rtpCapabilities);
      console.log(audioDevice.rtpCapabilities);
      socketRef.current.emit(
        "createWebRtcTransport",
        { sender: false },
        ({ params, params2 }) => {
          // The server sends back params needed
          // to create Send Transport on the client side
          if (params.error) {
            console.log(params.error);
            return;
          }
          if (params2.error) {
            console.log(params2.error);
            return;
          }

          console.log(params);
          console.log(params2);

          const consumerTransport = device.createRecvTransport(params);
          const audioConsumerTransport =
            audioDevice.createRecvTransport(params2);
          setConsumerTransport(consumerTransport);

          setAudioConsumerTransport(audioConsumerTransport);
        }
      );
    }
  }, [device, audioDevice]);

  useEffect(() => {
    if (
      consumerTransport &&
      audioConsumerTransport &&
      msRoom === false &&
      canConsume?.from
    ) {
      console.log(consumerTransport);
      console.log(audioConsumerTransport);
      consumerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-recv-connect', ...)
            await socketRef.current.emit("transport-recv-connect", {
              dtlsParameters,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            // Tell the transport that something was wrong
            errback(error);
          }
        }
      );
      audioConsumerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-recv-connect', ...)
            await socketRef.current.emit("transport-recv-connect", {
              dtlsParameters,
              isAudio: true,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            // Tell the transport that something was wrong
            errback(error);
          }
        }
      );
      setConnectConsume(true);
    }
  }, [consumerTransport, audioConsumerTransport]);
  useEffect(() => {
    if (connectConsume && msRoom === false && canConsume?.from) {
      (async () => {
        await socketRef.current.emit(
          "consume",
          {
            rtpCapabilities: device.rtpCapabilities,
            audioRtpCapabilities: audioDevice.rtpCapabilities,
          },
          async ({ params, params2 }) => {
            if (params.error) {
              console.log("Cannot Consume");
              return;
            }
            if (params2.error) {
              console.log("Cannot Consume");
              return;
            }

            console.log(params);
            console.log(params2);
            // then consume with the local consumer transport
            // which creates a consumer
            let consumerObj = await consumerTransport.consume({
              id: params.id,
              producerId: params.producerId,
              kind: params.kind,
              rtpParameters: params.rtpParameters,
            });
            let audioConsumerObj = await audioConsumerTransport.consume({
              id: params2.id,
              producerId: params2.producerId,
              kind: params2.kind,
              rtpParameters: params2.rtpParameters,
            });

            // destructure and retrieve the video track from the producer
            const { track } = consumerObj;
            const { audioTrack } = audioConsumerObj;

            console.log(track);
            console.log(audioConsumerObj.track, "audio");

            remoteStream.getTracks().forEach((track) => {
              remoteStream.removeTrack(track);
            });
            remoteStream.addTrack(consumerObj.track);
            remoteStream.addTrack(audioConsumerObj.track);

            const remoteVideo = document.getElementById("user2");

            // remoteVideoRef.srcObject = null;
            remoteVideo.srcObject = remoteStream;

            remoteStream.getTracks().forEach((track) => {
              console.log(track);
            });

            // the server consumer started with media paused
            // so we need to inform the server to resume
            socketRef.current.emit("consumer-resume");
            setClientProduce(true);
          }
        );
      })();
    }
  }, [connectConsume]);

  // TODO: client start produce

  useEffect(() => {
    if (clientProduce) {
      console.log(clientProduce);

      const track = stream.getVideoTracks()[0];
      const sound = stream.getAudioTracks()[0];
      const vidParams = {
        track: track,
        ...params,
      };
      const audParams = {
        track: sound,
        ...paramsAud,
      };
      // const localVideo = document.getElementById("user1");
      // localVideo.srcObject = null;
      setVideoParams(vidParams);
      setAudioParams(audParams);
      socketRef.current.emit("setClientProduce", canConsume, (data) => {
        console.log(data);
        (async () => {
          const newDevice = new Device();
          const newAudioDevice = new Device();
          await newDevice.load({
            // see getRtpCapabilities() below
            routerRtpCapabilities: data.rtpCapabilities,
          });
          await newAudioDevice.load({
            // see getRtpCapabilities() below
            routerRtpCapabilities: data.audioRtpCapabilities,
          });
          setDeviceAlt(newDevice);
          setAudioDeviceAlt(newAudioDevice);
        })();
      });
    }
  }, [clientProduce]);

  useEffect(() => {
    if (deviceAlt && audioDeviceAlt && msRoom === false && canConsume?.from) {
      console.log(deviceAlt);
      console.log(audioDeviceAlt);
      console.log("deviceAlt");
      console.log(deviceAlt.rtpCapabilities);

      socketRef.current.emit(
        "createWebRtcTransportClient",
        { sender: true },
        ({ params, params2 }) => {
          // The server sends back params needed
          // to create Send Transport on the client side
          if (params.error) {
            console.log(params.error);
            return;
          }
          console.log(params);
          const producerTransport = deviceAlt.createSendTransport(params);
          const audioProducerTransport =
            audioDeviceAlt.createSendTransport(params2);
          setProducerTransport(producerTransport);
          setAudioProducerTransport(audioProducerTransport);
        }
      );
    }
  }, [deviceAlt, audioDeviceAlt]);

  useEffect(() => {
    if (producerTransport && audioProducerTransport && msRoom === false) {
      console.log(producerTransport);
      producerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-connect', ...)
            await socketRef.current.emit("transport-connect-client", {
              dtlsParameters,
              msRoom,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            errback(error);
          }
        }
      );
      audioProducerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-connect', ...)
            await socketRef.current.emit("transport-connect-client", {
              dtlsParameters,
              msRoom,
              isAudio: true,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            errback(error);
          }
        }
      );

      producerTransport.on("produce", async (parameters, callback, errback) => {
        console.log(parameters.kind);

        try {
          // tell the server to create a Producer
          // with the following parameters and produce
          // and expect back a server side producer id
          // see server's socketRef.current.on('transport-produce', ...)
          await socketRef.current.emit(
            "transport-produce-client",
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
              msRoom,
            },
            ({ id }) => {
              // Tell the transport that parameters were transmitted and provide it with the
              // server side producer's id.
              console.log(id);
              callback({ id });
            }
          );
        } catch (error) {
          errback(error);
        }
      });
      audioProducerTransport.on(
        "produce",
        async (parameters, callback, errback) => {
          console.log(parameters.kind);

          try {
            // tell the server to create a Producer
            // with the following parameters and produce
            // and expect back a server side producer id
            // see server's socketRef.current.on('transport-produce', ...)
            await socketRef.current.emit(
              "transport-produce-client",
              {
                kind: parameters.kind,
                rtpParameters: parameters.rtpParameters,
                appData: parameters.appData,
                msRoom,
                isAudio: true,
              },
              ({ id }) => {
                // Tell the transport that parameters were transmitted and provide it with the
                // server side producer's id.
                console.log(id);
                callback({ id });
              }
            );
          } catch (error) {
            errback(error);
          }
        }
      );
      setCanClientProduce(true);
    }
  }, [producerTransport, audioProducerTransport]);

  useEffect(() => {
    if (canClientProduce && msRoom === false) {
      (async () => {
        let vidProd = await producerTransport.produce(videoParams);
        let audProd = await audioProducerTransport.produce(audioParams);
        vidProd.on("trackended", () => {
          console.log("track ended");

          // close video track
        });

        vidProd.on("transportclose", () => {
          console.log("transport ended");

          // close video track
        });
        console.log(vidProd);

        setclientProducer(vidProd);
        // let audProd = await producerTransport.produce(audioParams);
        // console.log(audProd);
        // setAudioProducer(audProd);
        setCanHostConsume(true);
      })();
    }
  }, [canClientProduce]);

  useEffect(() => {
    if (canHostConsume) {
      console.log(canHostConsume);
      socketRef.current.emit("setHostCanConsume", {
        from: socketRef.current.id,
        to: remoteId,
      });
    }
  }, [canHostConsume]);
  //
  // TODO: host consumes client stream
  useEffect(() => {
    if (hostStartConsume) {
      console.log(hostStartConsume);

      socketRef.current.emit("setHostConsume", canConsume, async (data) => {
        const newDevice = new Device();
        await newDevice.load({
          // see getRtpCapabilities() below
          routerRtpCapabilities: data.rtpCapabilities,
        });
        setDeviceAlt(newDevice);

        const newAudioDevice = new Device();

        await newAudioDevice.load({
          // see getRtpCapabilities() below
          routerRtpCapabilities: data.audioRtpCapabilities,
        });

        setAudioDeviceAlt(newAudioDevice);
      });
    }
  }, [hostStartConsume]);

  useEffect(() => {
    if (deviceAlt && audioDeviceAlt && msRoom && hostStartConsume?.from) {
      console.log(deviceAlt);
      console.log("deviceAlt");
      console.log(deviceAlt.rtpCapabilities);

      socketRef.current.emit(
        "createWebRtcTransportClient",
        { sender: false },
        ({ params, params2 }) => {
          // The server sends back params needed
          // to create Send Transport on the client side
          if (params.error) {
            console.log(params.error);
            return;
          }
          console.log(params);
          const consumerTransport = deviceAlt.createRecvTransport(params);
          const audioConsumerTransport =
            audioDeviceAlt.createRecvTransport(params2);
          setConsumerTransport(consumerTransport);
          setAudioConsumerTransport(audioConsumerTransport);
        }
      );
    }
  }, [deviceAlt, audioDeviceAlt]);

  useEffect(() => {
    if (
      consumerTransport &&
      audioConsumerTransport &&
      msRoom &&
      hostStartConsume?.from
    ) {
      console.log(consumerTransport);
      consumerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-recv-connect', ...)
            await socketRef.current.emit("transport-recv-connect-host", {
              dtlsParameters,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            // Tell the transport that something was wrong
            errback(error);
          }
        }
      );
      audioConsumerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            // Signal local DTLS parameters to the server side transport
            // see server's socket.on('transport-recv-connect', ...)
            await socketRef.current.emit("transport-recv-connect-host", {
              dtlsParameters,
              isAudio: true,
            });

            // Tell the transport that parameters were transmitted.
            callback();
          } catch (error) {
            // Tell the transport that something was wrong
            errback(error);
          }
        }
      );
      setConnectHostConsume(true);
    }
  }, [consumerTransport, audioConsumerTransport]);

  useEffect(() => {}, [connectHostConsume]);

  useEffect(() => {
    if (connectHostConsume && msRoom && hostStartConsume?.from) {
      (async () => {
        await socketRef.current.emit(
          "consume-host",
          {
            rtpCapabilities: deviceAlt.rtpCapabilities,
            audioRtpCapabilities: audioDeviceAlt.rtpCapabilities,
          },
          async ({ params, params2 }) => {
            if (params.error) {
              console.log("Cannot Consume");
              return;
            }

            console.log(params);
            // then consume with the local consumer transport
            // which creates a consumer
            let consumerObj = await consumerTransport.consume({
              id: params.id,
              producerId: params.producerId,
              kind: params.kind,
              rtpParameters: params.rtpParameters,
            });
            let audConsumerObj = await audioConsumerTransport.consume({
              id: params2.id,
              producerId: params2.producerId,
              kind: params2.kind,
              rtpParameters: params2.rtpParameters,
            });

            // destructure and retrieve the video track from the producer
            const { track } = consumerObj;

            console.log(track);
            console.log(audConsumerObj);

            const remoteVideo = document.getElementById("user2");

            remoteVideoRef.srcObject = null;

            remoteStream.getTracks().forEach((track) => {
              remoteStream.removeTrack(track);
            });

            remoteStream.addTrack(track);
            remoteStream.addTrack(audConsumerObj.track);

            remoteVideo.srcObject = remoteStream;

            remoteStream.getTracks().forEach((track) => {
              console.log(track);
            });

            // the server consumer started with media paused
            // so we need to inform the server to resume
            socketRef.current.emit("consumer-resume-host");
            // setClientProduce(true);
          }
        );
      })();
    }
  }, [connectHostConsume]);

  const Message = ({ message, localClientName }) => {
    return (
      <li
        key={message.id}
        className={`msgItem mb-1 ${
          message.clientName === localClientName ? "right" : "left"
        }`}
      >
        <p
          className={`m-0 mb-1 clientNameDate ${
            message.clientName === localClientName ? "right" : "left"
          }`}
        >
          <span className="clientName"> {message.clientName} </span>
          <span className="chatTimeStamp">{message.time} </span>
        </p>
        <p
          className={`msg m-0 ${
            message.clientName === localClientName ? "right" : "left"
          }`}
        >
          {message.message}
        </p>
      </li>
    );
  };
  //chat listener

  useEffect(() => {
    // if (typeof Window !== "undefined") {
    let counter = 0;
    const form = document.getElementById("form");
    const input = document.getElementById("msgInput");
    // const messages = document.getElementById("messages");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (input.value) {
          // compute a unique offset
          if (socketRef.current) {
            const clientOffset = `${socketRef.current.id}-${counter++}`;
            socketRef.current.emit("chat message", {
              msg: input.value,
              clientOffset: clientOffset,
              roomAccessKey: accessKey,
              clientName: localClientName,
            });
            input.value = "";
          }
        }
      });
    }
    // }
  }, []);

  let toggleChat = async () => {
    const messagesContainer = document.getElementById("component_wrapper");
    const membersVideoContainer = document.getElementById("members_container");
    const input = document.getElementById("msgInput");
    const chatContainer = document.getElementById("chat-container");
    const settingsContainer = document.getElementById("settings-wrapper");

    if (!isChatVisible && !isSettingsVisible) {
      try {
        membersVideoContainer.style.width = "75%";

        // Add event listener for transitionend event
        membersVideoContainer.addEventListener(
          "transitionend",
          () => {
            // Render the chat component contents after width adjustment is completed
            messagesContainer.style.width = "25%";
            messagesContainer.style.display = "block";
            chatContainer.style.display = "block";

            setIsChatVisible(true);
            input.focus();
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          },
          { once: true }
        ); // Ensure the event listener is removed after firing once
      } catch (e) {
        console.log("could not set chat visible", e);
      }
    } else if (isSettingsVisible && !isChatVisible) {
      setIsSettingsVisible(false);
      settingsContainer.style.display = "none";

      setIsChatVisible(true);

      chatContainer.style.display = "block";
      input.focus();
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }

      // toggleSettings();
    } else {
      try {
        setIsChatVisible(false);
        setIsSettingsVisible(false);
        chatContainer.style.display = "none";
        messagesContainer.style.width = "0%";
        messagesContainer.style.display = "none";
        membersVideoContainer.style.width = "100%";
        settingsContainer.style.display = "none";
      } catch (e) {
        console.log("could not set chat not-visible", e);
      }
    }
  };

  // Function to start screen sharing
  let toggleScreenSharing = async () => {
    if (msRoom === null) {
      if (!isScreenSharing && !screenSharingId) {
        // Check for screensharing true and existing screenshareID
        // If no IDs exist, get new stream for the screen stream
        setIsScreenSharing(true);
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia(
            screenRecordConstraints
          );

          setStream(stream);
          setScreenStream(stream);
          localVideoRef.current.srcObject = stream;
          setScreenSharingId(socketID);
          console.log("current share screen user", localClientName, socketID);
          setIsScreenSharing(true);
        } catch (e) {
          console.error("Could not switch stream to screenshare", e);
        }
      } else {
        // Check for screensharing true and existing screenshareID
        // If IDs exist, get new stream for video and audio camera
        setIsScreenSharing(false);

        if (screenStream) {
          screenStream.getTracks().forEach((track) => track.stop());
          setScreenStream(null);
          setScreenSharingId("");
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints); // Get video and audio devices from user
          setStream(stream); // Switch stream to obtained media stream
          localVideoRef.current.srcObject = stream;
        } catch (e) {
          console.error("Could not turn on user screen & switch stream", e);
        }
      }

      if (socketID?.peerConnection) {
        Object.values(socketID.peerConnection).forEach((peer) => {
          const videoTrack = stream
            ?.getTracks()
            .find((track) => track.kind === "video");
          if (videoTrack) {
            peer
              .getSenders()[1]
              .replaceTrack(videoTrack)
              .catch((e) => {
                console.error(e);
              });
          }
        });
      }
    } else {
      alert("screen sharing is disabled on backup call");
    }
  };

  //listen for end of stream from outside screen toggle button

  if (screenStream) {
    screenStream.getVideoTracks().onended = function () {
      // setIsScreenSharing(false);
      // toggleScreenSharing();
      // doWhatYouNeedToDo();
      setIsScreenSharing(false);
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setScreenSharingId("");
    };
  }
  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <main className="containerr m-0 p-0">
      <Row id="room_container" className="p-0 m-0">
        <Col xs={12} id="members_container" className="p-0 m-0">
          <Row id="videos" className="p-0 m-0">
            <Col className="p-0 m-0 videoBg" id="user1_div">
              {/* {stream && ( */}
              <video
                className="videoPlayer p-0"
                id="user1"
                autoPlay
                playsInline
                muted
                ref={localVideoRef}
              ></video>

              <h1 id="localClientName" className="clientDisplayName">
                {localClientName}
              </h1>
            </Col>

            <Col id="user2_div" className="p-0 m-0 videoBg">
              <video
                className="videoPlayer p-0"
                id="user2"
                ref={remoteVideoRef}
                autoPlay
                playsInline
              ></video>

              <h1 id="remoteClientName" className="clientDisplayName">
                {remoteClientName}
              </h1>
            </Col>
          </Row>
        </Col>

        <Col xs={12} className="footer-container">
          <Row className="footer p-3">
            <Col xs={2} title="Psymax Logo" className="logo_div logo">
              <img className="logo_icon" src="/icons/logo.svg" alt="logo" />
            </Col>

            <Col xs={7} id="controls" className="control-container-wrapper">
              <div
                className="control-container"
                id="mic-btn"
                title="Bedieningselementen voor audio-invoer"
              >
                {/* <label htmlFor="audio">Select Audio Input Device:</label> */}
                <select
                  className="deviceChangeBtn"
                  id="audio"
                  value={selectedAudio}
                  onChange={handleAudioChange}
                  title="Klik om het audio-invoerapparaat te wijzigen"
                >
                  {devices.audio.map((device, index) => (
                    <option key={index} value={device.deviceId}>
                      {device.label || `Audio Device ${index + 1}`}
                    </option>
                  ))}
                </select>

                <img
                  className="icon"
                  title="Mikrofon umschalten"
                  src={isMicOn ? "/icons/mic-on.svg" : "/icons/mic-off.svg"}
                  alt="Mikrofontaste"
                  onClick={toggleMic}
                />
              </div>

              <div
                title="Bedieningselementen voor video-invoer"
                className="control-container"
                id="camera-btn"
              >
                {/* <label htmlFor="video">Select Video Device:</label> */}
                <select
                  className="deviceChangeBtn"
                  id="video"
                  value={selectedVideo}
                  onChange={handleVideoChange}
                  title="Klik om het video-invoerapparaat te wijzigen"
                >
                  {devices.video.map((device, index) => (
                    <option key={index} value={device.deviceId}>
                      {device.label || `Video Device ${index + 1}`}
                    </option>
                  ))}
                </select>

                <img
                  id="cameraBtn"
                  className="icon"
                  title="Kamera umschalten"
                  src={
                    isCameraOn
                      ? "/icons/camera-on.svg"
                      : "/icons/camera-off.svg"
                  }
                  alt="Kamerataste"
                  onClick={toggleCamera}
                />
              </div>

              <div
                className="control-container"
                id="pres-btn"
                title="Bildschirm teilen"
              >
                <img
                  className="icon"
                  src={
                    isScreenSharing
                      ? "/icons/pres-on.svg"
                      : "/icons/pres-off.svg"
                  }
                  alt="Bildschirm teilen"
                  onClick={toggleScreenSharing}
                />
              </div>

              <div
                className="control-container"
                id="settings-btn"
                title="Einstellungen"
              >
                <img
                  className="icon"
                  src="/icons/settings.svg"
                  alt="settings button"
                  onClick={toggleSettings}
                />
              </div>

              <div
                title="Anruf beenden"
                className="control-container"
                id="leave-call-btn"
              >
                <img
                  className="icon"
                  src="/icons/leave-call.svg"
                  alt="leave call button"
                  onClick={leaveCall}
                />
              </div>
              <div
                title="Anruf beenden"
                className="control-container"
                id="restart-call-btn"
              >
                <img
                  className="icon"
                  src="/icons/refresh.svg"
                  alt="refresh connection"
                  onClick={restartCall}
                />
              </div>
              <div
                title="Anruf beenden"
                className="control-container"
                id="restart-full-call-btn"
              >
                <img
                  className="icon"
                  src="/icons/server.svg"
                  alt="refresh connection"
                  onClick={restartFullCall}
                />
              </div>
            </Col>

            <Col
              xs={3}
              className="chat_div control-container"
              id="chat-btn"
              title="Plaudern"
            >
              <img
                className="icon"
                src="/icons/chat.svg"
                alt="Plaudern"
                onClick={toggleChat}
              />
            </Col>
          </Row>
        </Col>

        <Col id="component_wrapper" className="p-0">
          <Row id="chat-container" className="">
            <Col>
              <div className="header-close-btn-wrapper">
                <i
                  onClick={toggleChat}
                  className="bi bi-x-circle header-close-btn"
                  title="Sluiten" //means close
                />
              </div>
            </Col>
            <Col className="side-bar-header">
              <div className="sidebar-title-wrapper">
                <h2 className="p-3 sidebar-title mb-0">Chat</h2>
              </div>
            </Col>
            <Col className="p-0 m-0 chat-messages">
              <ul id="messages" className="p-3 mb-0">
                {messages.map((message) => (
                  <Message
                    key={message.id}
                    message={message}
                    localClientName={localClientName}
                  />
                ))}
                <li className="messagesEndRef" ref={messagesEndRef} />
              </ul>
            </Col>

            <Col>
              <form id="form" action="" className="">
                <Row id="sendMsgRow" className="p-0 m-0">
                  <Col xs={11} className="p-0">
                    <input
                      placeholder="Nachricht absenden"
                      title="Nachrichtenbereich"
                      id="msgInput"
                      className="border-0 p-2"
                      autoComplete="off"
                    />
                  </Col>

                  <Col xs={1} className="p-0">
                    <button
                      type="submit"
                      id="sendMsgBtn"
                      title="Chat-Nachricht senden"
                      className="sendMsgBtn btn"
                    >
                      <img
                        alt="Chat-Nachricht senden"
                        src="/icons/send-chat-msg.svg"
                      ></img>
                    </button>
                  </Col>
                </Row>
              </form>
            </Col>
          </Row>

          <Settings
            isCameraTest={isCameraTest}
            setIsCameraTest={setIsCameraTest}
            isCameraOn={isCameraOn}
            videoTestRef={videoTestRef}
            isMicTest={isMicTest}
            setIsMicTest={setIsMicTest}
            micTestRef={micTestRef}
            isMicOn={isMicOn}
            isSpeakerTest={isSpeakerTest}
            setIsSpeakerTest={setIsSpeakerTest}
            setIsSpeakerOn={setIsSpeakerOn}
            isSpeakerOn={isSpeakerOn}
            onDeviceChange={handleDeviceChange}
            stream={stream}
            toggleSettings={toggleSettings}
          />
        </Col>
      </Row>
    </main>
  );
};

export { FullRtc };
