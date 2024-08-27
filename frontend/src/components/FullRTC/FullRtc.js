"use client";
// import styles from "./FullRtc.module.scss";
import "./fullrtc.css";
import { useContext, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import conferenceContext from "../../context/conference.context";
import { Row, Col } from "react-bootstrap";
import { Device } from "mediasoup-client";
import Settings from "../Settings/Settings";
import { videoParams, audioParams } from "../../utils/config";
import toast from "react-hot-toast";
// import Link from "next/link";

import {
  getUserMedia,
  onSendMessage,
  onTypeMessage,
  addVideoStream,
  addAudioStream,
  addScreenStream,
  resetScreen,
  testUserMedia,
  onSetVideoDevice,
  onSetAudioDevice,
} from "../../utils/utilFn";

import {
  onJoinRoom,
  onPeerConnected,
  onCreateProducerTP,
  onGetProducers,
  onNewProducer,
  onConsumeState,
  onParticipantLeft,
  onStoppedScreen,
  onIncomingMessage,
  ontoggleRemoteMedia,
} from "../../utils/socketHandlers";

import {
  messagesArray,
  mediaList,
  screenArray,
  mediaDeviceList,
} from "./Lists";

import {
  createProducerDevices,
  producerTransportListeners,
  produceVideoStream,
  produceAudioStream,
  produceScreenStream,
} from "../../utils/mediaSoupUtils";

let socketObj = io.connect(process.env.NEXT_PUBLIC_SIGNAL_HOST, {
  transports: ["websocket"],
});

let remoteVideoProducers = {};
let remoteAudioProducers = {};
let remoteScreenProducers = {};

const FullRtc = () => {
  const router = useRouter();
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const messagesEndRef = useRef(null);

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

  let toggleSettings = async () => {
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

  // TODO: media soup integration.

  const [socket, setSocket] = useState(null);
  const [consumeVideoState, setConsumeVideoState] = useState("");
  const [consumeAudioState, setConsumeAudioState] = useState("");
  const [consumeScreenState, setConsumeScreenState] = useState("");
  const [isStreamingVideo, setIsStreamingVideo] = useState(false);
  const [isStreamingAudio, setIsStreamingAudio] = useState(false);
  const [isStreamingScreen, setIsStreamingScreen] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [videoEls, setVideoEls] = useState([]);
  const [audioEls, setAudioEls] = useState([]);
  const [screenEls, setScreenEls] = useState([]);
  const [screenReset, setScreenReset] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState(null);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [userName, setUserName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const confState = useContext(conferenceContext);

  const {
    roomRouterRtp,
    setRoomRouterRtp,
    producerDevices,
    setProducerDevices,
    producerTransports,
    setProducerTransports,
    remoteVideoStream,
    setRemoteVideoStream,
    remoteAudioStream,
    setRemoteAudioStream,
    remoteScreenStream,
    setRemoteScreenStream,
  } = confState.mediaSoup;
  useEffect(() => {
    (async () => {
      try {
        let params = window.location.search.replace("?", "");
        if (params) {
          params = params.split("&");

          if (params.length > 1) {
            let key = params[0].split("=")[1];
            let name = params[1].split("=")[1];
            setAccessKey(key);
            setUserName(name);
            getUserMedia(
              navigator,
              setSocketId,
              setSocket,
              socketObj,
              setVideoDevices,
              setAudioDevices
            );
          } else {
            toast.error("you are not in a room");
            console.log("toast");
          }
        } else {
          toast.error("you are not in a room");
          console.log("toast");
        }
      } catch (error) {
        console.log(error.message);
        toast.error("you are not in a room");
        console.log("toast");
      }
    })();
  }, []);

  useEffect(() => {
    if (socket && confState) {
      console.log(socketId);

      socket.emit(
        "joinConferenceRoom",
        {
          userName,
          accessKey,
          socketId,
        },
        onJoinRoom(roomRouterRtp, setRoomRouterRtp, messages, setMessages)
      );
    }
  }, [socket]);

  // when room router's rtp is set.
  useEffect(() => {
    if (roomRouterRtp) {
      (async () => {
        setSocketId(socketObj.id);
        await createProducerDevices(
          producerDevices,
          roomRouterRtp,
          Device,
          setProducerDevices
        );
      })();
    }
  }, [roomRouterRtp]);

  useEffect(() => {
    if (producerDevices) {
      const videoDeviceRtpCapabilities =
        producerDevices.videoDevice.rtpCapabilities;
      const audioDeviceRtpCapabilities =
        producerDevices.audioDevice.rtpCapabilities;
      const screenDeviceRtpCapabilities =
        producerDevices.screenDevice.rtpCapabilities;
      if (
        videoDeviceRtpCapabilities &&
        audioDeviceRtpCapabilities &&
        screenDeviceRtpCapabilities
      ) {
        socket.emit(
          "createWebRtcTransport",
          { producer: true, consumer: false, accessKey, userName, socketId },
          onCreateProducerTP(
            producerDevices,
            producerTransports,
            setProducerTransports
          )
        );
      }
    }
  }, [producerDevices]);

  useEffect(() => {
    // add listeners for video audio producers
    if (producerTransports) {
      producerTransportListeners(
        accessKey,
        userName,
        socketId,
        producerTransports,
        socket
      );

      socket.emit(
        "getAvailableProducers",
        {
          accessKey,
          userName,
          socketId,
        },
        onGetProducers(
          remoteVideoProducers,
          remoteAudioProducers,
          remoteScreenProducers,
          setConsumeVideoState,
          setConsumeAudioState,
          setConsumeScreenState
        )
      );
      socket.on("peerConnected", onPeerConnected());
      socket.on("incomingMessage", onIncomingMessage(messages, setMessages));

      socket.on(
        "stopScreenConsumer",
        onStoppedScreen(
          remoteScreenProducers,
          setConsumeScreenState,
          setScreenReset
        )
      );

      socket.on("toggleRemoteMedia", ontoggleRemoteMedia());
      socket.on(
        "participantLeft",
        onParticipantLeft(
          remoteVideoProducers,
          remoteAudioProducers,
          remoteScreenProducers,
          accessKey,
          userName,
          socketId,
          socket
        )
      );

      toast.success("media is ready for streaming");
    }
  }, [producerTransports]);

  // ///////////////////////////////////////////////////////////////////////// consume media

  useEffect(() => {
    if (socket) {
      onNewProducer(
        remoteVideoProducers,
        remoteAudioProducers,
        remoteScreenProducers,
        setConsumeVideoState,
        setConsumeAudioState,
        setConsumeScreenState,
        socket
      );
    }
  }, [socket]);

  useEffect(() => {
    const isVideo = true;
    const isAudio = false;
    const isScreen = false;
    console.log(remoteVideoProducers);

    onConsumeState(
      consumeVideoState,
      remoteVideoProducers,
      isVideo,
      isAudio,
      isScreen,
      accessKey,
      userName,
      socketId,
      socket,
      Device,
      remoteVideoStream,
      setRemoteVideoStream
    );
  }, [consumeVideoState]);

  useEffect(() => {
    const isVideo = false;
    const isAudio = true;
    const isScreen = false;
    // console.log(remoteAudioProducers);
    onConsumeState(
      consumeAudioState,
      remoteAudioProducers,
      isVideo,
      isAudio,
      isScreen,
      accessKey,
      userName,
      socketId,
      socket,
      Device,
      remoteAudioStream,
      setRemoteAudioStream
    );
  }, [consumeAudioState]);

  useEffect(() => {
    console.log(consumeScreenState);
    const isVideo = false;
    const isAudio = false;
    const isScreen = true;
    setScreenReset("");

    onConsumeState(
      consumeScreenState,
      remoteScreenProducers,
      isVideo,
      isAudio,
      isScreen,
      accessKey,
      userName,
      socketId,
      socket,
      Device,
      remoteScreenStream,
      setRemoteScreenStream
    );
  }, [consumeScreenState]);

  // add stream to hmtl;

  useEffect(() => {
    if (remoteVideoStream.length > 0) {
      console.log(remoteVideoStream);

      setVideoEls([...remoteVideoStream]);
    }
  }, [remoteVideoStream]);

  useEffect(() => {
    if (remoteAudioStream.length > 0) {
      console.log(remoteAudioStream);

      setAudioEls([...remoteAudioStream]);
    }
  }, [remoteAudioStream]);

  useEffect(() => {
    if (remoteScreenStream.length > 0) {
      console.log(remoteScreenStream);

      setScreenEls([...remoteScreenStream]);
    }
  }, [remoteScreenStream]);

  useEffect(() => {
    addVideoStream(videoEls);
  }, [videoEls]);

  useEffect(() => {
    addAudioStream(audioEls);
  }, [audioEls]);

  useEffect(() => {
    addScreenStream(screenEls);
  }, [screenEls]);

  useEffect(() => {
    resetScreen(screenReset, screenEls, setScreenEls, setRemoteScreenStream);
  }, [screenReset]);

  const videoList = mediaList(remoteVideoStream);
  const audioList = mediaList(remoteAudioStream);
  const screenList = screenArray(remoteScreenStream);
  const messagesList = messagesArray(messages, userName);

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesList]);

  useEffect(() => {
    if (videoDevices.length > 0) {
      console.log(videoDevices);
    }
  }, [videoDevices]);

  useEffect(() => {
    if (audioDevices.length > 0) {
      console.log(audioDevices);
    }
  }, [audioDevices]);

  useEffect(() => {
    if (selectedVideoDevice !== null) {
      testUserMedia(
        navigator,
        videoDevices[selectedVideoDevice],
        audioDevices[selectedAudioDevice || 0],
        "video"
      );
    }
  }, [selectedVideoDevice]);

  useEffect(() => {
    if (selectedAudioDevice !== null) {
      testUserMedia(
        navigator,
        videoDevices[selectedVideoDevice || 0],
        audioDevices[selectedAudioDevice],
        "audio"
      );
    }
  }, [selectedAudioDevice]);

  //////////////////////////ui

  return (
    <main className="containerr m-0 p-0">
      <Row id="room_container" className="p-0 m-0">
        <Col xs={12} id="members_container" className="p-0 m-0">
          <Row id="videos" className="p-0 m-0">
            <Col className="p-0 m-0 videoBg" id="user1_div">
              {/* {stream && ( */}
              <video
                className="videoPlayer p-0"
                id="local-video"
                autoPlay
                playsInline
              ></video>
              <audio
                className="VideoElem"
                id={`local-audio`}
                autoPlay
                playsInline
                muted
              ></audio>
              <h1 id="localClientName" className="clientDisplayName">
                {/* {localClientName} */}
              </h1>
            </Col>

            <Col id="user2_div" className="p-0 m-0 videoBg">
              <div className="videoWrapper">{videoList}</div>
              {audioList}
              <h1 id="remoteClientName" className="clientDisplayName">
                {/* {remoteClientName} */}
              </h1>
            </Col>
            <Col id="user2_div" className="p-0 m-0 videoBg">
              <div className="screenWrapper">{screenList}</div>
            </Col>
          </Row>
        </Col>

        <Col xs={12} className="footer-container">
          <Row className="footer p-3">
            <Col title="Psymax Logo" className="logo_div logo">
              <img className="logo_icon" src="/icons/logo.svg" alt="logo" />
            </Col>

            <Col id="controls" className="">
              <div
                className="control-container"
                title="Mikrofon umschalten"
                id="mic-btn"
              >
                <img
                  className="icon"
                  src={isMicOn ? "/icons/mic-on.svg" : "/icons/mic-off.svg"}
                  alt="Mikrofontaste"
                  onClick={produceAudioStream(
                    isStreamingAudio,
                    audioParams,
                    setIsStreamingAudio,
                    producerTransports,
                    audioDevices[selectedAudioDevice || 0],
                    socket,
                    accessKey,
                    setIsMicOn,
                    userName
                  )}
                />
              </div>

              <div
                className="control-container"
                id="camera-btn"
                title="Kamera umschalten"
              >
                <img
                  id="cameraBtn"
                  className="icon"
                  src={
                    isCameraOn
                      ? "/icons/camera-on.svg"
                      : "/icons/camera-off.svg"
                  }
                  alt="Kamerataste"
                  onClick={produceVideoStream(
                    isStreamingVideo,
                    videoParams,
                    setIsStreamingVideo,
                    producerTransports,
                    videoDevices[selectedVideoDevice || 0],
                    socket,
                    accessKey,
                    setIsCameraOn,
                    userName
                  )}
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
                  onClick={produceScreenStream(
                    accessKey,
                    userName,
                    socketId,
                    isStreamingVideo,
                    isStreamingAudio,
                    isStreamingScreen,
                    videoParams,
                    setIsStreamingScreen,
                    setScreenReset,
                    producerTransports,
                    socket,
                    setIsScreenSharing
                  )}
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
                  onClick={() => {
                    if (socket) {
                      socket.emit("disconnected");
                    }
                    router.push("/lobby");
                  }}
                />
              </div>
            </Col>

            <Col
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

        <Col id="component_wrapper" className="p-1">
          <Row id="chat-container" className="">
            <Col>
              <h2 className="p-3 chat-title mb-0">Chat</h2>
            </Col>
            <Col className="p-0 m-0 chat-messages">
              <ul id="messages" className="p-3 mb-0">
                {messagesList}

                <li className="messagesEndRef" ref={messagesEndRef} />
              </ul>
            </Col>

            <Col>
              <form
                id="form"
                action=""
                className=""
                onSubmit={onSendMessage(
                  accessKey,
                  socketId,
                  messageInput,
                  setMessageInput,
                  userName,
                  messages,
                  setMessages,
                  socket
                )}
              >
                <Row id="sendMsgRow" className="p-0 m-0">
                  <Col xs={11} className="p-0">
                    <input
                      placeholder="Nachricht absenden"
                      title="Nachrichtenbereich"
                      id="msgInput"
                      className="border-0 p-2"
                      autoComplete="off"
                      onChange={onTypeMessage(setMessageInput)}
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
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isSpeakerOn={isSpeakerOn}
            videoList={mediaDeviceList(
              videoDevices,
              onSetVideoDevice,
              setSelectedVideoDevice
            )}
            audioList={mediaDeviceList(
              audioDevices,
              onSetAudioDevice,
              setSelectedAudioDevice
            )}
            isStreamingAudio={isStreamingAudio}
          />
        </Col>
      </Row>
    </main>
  );
};

export { FullRtc };
