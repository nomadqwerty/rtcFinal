import toast from "react-hot-toast";
const onJoinRoom = (
  roomRouterRtp,
  setRoomRouterRtp,
  messages,
  setMessages,
  setParticipantsList
) => {
  return (data) => {
    // room is set up start setting up to produce streams (video, audio).
    try {
      if (
        data?.audioRtpCapabilities &&
        data?.videoRtpCapabilities &&
        data?.screenRtpCapabilities
      ) {
        if (roomRouterRtp === null) {
          console.log(data);
          if (data.participants) {
            setParticipantsList([...data.participants]);
          }
          setRoomRouterRtp(data);
          console.log(data.messages);
          for (let message of data.messages) {
            console.log(message);
            message.msgObj.type = "received";
            messages.push(message.msgObj);
          }
          const newMessages = messages;
          setMessages([...newMessages]);
          toast.success("you have been added to a room");
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };
};

const onPeerConnected = (setParticipantsList, participantsList) => {
  return (data) => {
    participantsList.push(data);
    const participants = [...participantsList];
    setParticipantsList(participants);
    console.log(data);
    toast.success(`${data.participantName} joined the room`);
  };
};

const onCreateProducerTP = (
  producerDevices,
  producerTransports,
  setProducerTransports
) => {
  return (data) => {
    try {
      if (
        producerDevices.videoDevice &&
        producerDevices.audioDevice &&
        producerDevices.screenDevice
      ) {
        // create send transport on each producerDevice;
        const videoProducerTransport =
          producerDevices.videoDevice.createSendTransport(
            data.params.videoParams
          );

        const audioProducerTransport =
          producerDevices.audioDevice.createSendTransport(
            data.params.audioParams
          );

        const screenProducerTransport =
          producerDevices.screenDevice.createSendTransport(
            data.params.screenParams
          );

        if (producerTransports === null) {
          const transports = {};
          transports.videoProducerTransport = videoProducerTransport;

          transports.audioProducerTransport = audioProducerTransport;

          transports.screenProducerTransport = screenProducerTransport;

          setProducerTransports(transports);
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };
};

const onGetProducers = (
  remoteVideoProducers,
  remoteAudioProducers,
  remoteScreenProducers,
  setConsumeVideoState,
  setConsumeAudioState,
  setConsumeScreenState
) => {
  return (data) => {
    try {
      console.log("existing producers");
      console.log(data);

      const vidProd = Object.keys(data.avlVideoProducers);
      for (let i = 0; i < vidProd.length; i++) {
        remoteVideoProducers[vidProd[i]] = data.avlVideoProducers[vidProd[i]];
      }
      setConsumeVideoState("consumeAll");

      const audProd = Object.keys(data.avlAudioProducers);
      for (let i = 0; i < audProd.length; i++) {
        remoteAudioProducers[audProd[i]] = data.avlAudioProducers[audProd[i]];
      }
      setConsumeAudioState("consumeAll");

      const screenProd = Object.keys(data.avlScreenProducers);
      for (let i = 0; i < screenProd.length; i++) {
        remoteScreenProducers[screenProd[i]] =
          data.avlScreenProducers[screenProd[i]];
      }
      setConsumeScreenState("consumeAll");
    } catch (error) {
      console.log(error.message);
    }
  };
};

const onNewProducer = (
  remoteVideoProducers,
  remoteAudioProducers,
  remoteScreenProducers,
  setConsumeVideoState,
  setConsumeAudioState,
  setConsumeScreenState,
  socket
) => {
  try {
    socket.on("new-video", (data) => {
      console.log("someone is producing a video stream");
      console.log(data);
      remoteVideoProducers[data.from] = data;
      console.log(remoteVideoProducers);
      setConsumeVideoState(data.from);
    });
    socket.on("new-audio", (data) => {
      console.log("someone is producing an audio stream");
      remoteAudioProducers[data.from] = data;
      console.log(remoteAudioProducers);
      setConsumeAudioState(data.from);
    });
    socket.on("new-screen", (data) => {
      console.log("someone is producing a screen stream");
      console.log(data);
      remoteScreenProducers[data.from] = data;
      console.log(remoteScreenProducers);
      setConsumeScreenState(data.from);
    });
  } catch (error) {
    console.log(error.message);
  }
};

const onConsumeState = (
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
  remoteStreams,
  setRemoteStream
) => {
  try {
    let type;
    if (isVideo) {
      type = "video";
    }
    if (isAudio) {
      type = "audio";
    }
    if (isScreen) {
      type = "screen";
    }
    if (consumeVideoState?.length > 0) {
      console.log(`reset ${type} consumer state`);
      const keys = Object.keys(remoteVideoProducers);

      // console.log(keys);
      for (let i = 0; i < keys.length; i++) {
        const remoteProducer = remoteVideoProducers[keys[i]];
        if (!remoteProducer?.consumerDevice) {
          console.log(
            `setup ${type} consumer device for: `,
            remoteProducer.from
          );
          socket.emit(
            "createRcvTransport",
            {
              producer: false,
              consumer: true,
              accessKey,
              userName,
              socketId,
              isVideo,
              isAudio,
              isScreen,
              participantId: remoteProducer.from,
            },
            async (data) => {
              console.log(data);
              let params = data?.params;
              if (params) {
                remoteProducer.consumerDevice = new Device();
                await remoteProducer.consumerDevice.load({
                  routerRtpCapabilities: remoteProducer.rtpCapabilities,
                });
                remoteProducer.consumerTransport =
                  remoteProducer.consumerDevice.createRecvTransport(params);
                console.log(
                  "created remote consumer tp for: ",
                  remoteProducer.from
                );
                // console.log(remoteProducer);
                remoteProducer.consumerTransport.on(
                  "connect",
                  async ({ dtlsParameters }, callback, errback) => {
                    try {
                      await socket.emit("transport-recv-connect", {
                        dtlsParameters,
                        producer: false,
                        consumer: true,
                        accessKey,
                        userName,
                        socketId,
                        isVideo,
                        isAudio,
                        isScreen,
                        participantId: remoteProducer.from,
                      });

                      callback();
                    } catch (error) {
                      errback(error);
                    }
                  }
                );
                socket.emit(
                  "consume",
                  {
                    rtpCapabilities:
                      remoteProducer.consumerDevice.rtpCapabilities,
                    producer: false,
                    consumer: true,
                    accessKey,
                    userName,
                    socketId,
                    isVideo,
                    isAudio,
                    isScreen,
                    participantId: remoteProducer.from,
                    remoteProducerId: remoteProducer.producerId,
                  },
                  async (data) => {
                    console.log(data);
                    const params = data.params;
                    if (params) {
                      let consumerData =
                        await remoteProducer.consumerTransport.consume({
                          id: params.id,
                          producerId: params.producerId,
                          kind: params.kind,
                          rtpParameters: params.rtpParameters,
                        });

                      if (remoteProducer.kind === "video" && type === "video") {
                        console.log(remoteProducer);
                        let display = "block";
                        let nameDisplay = "none";
                        let muted = false;
                        if (remoteProducer?.action === "pause") {
                          display = "none";
                          muted = true;
                          nameDisplay = "block";
                        }
                        const videoEl = (
                          <video
                            className="videoPlayer p-0 user2 remote"
                            id={`${remoteProducer.from}-video`}
                            // key={remoteProducer.from}
                            autoPlay
                            muted={muted}
                            style={{ display: display }}
                            playsInline
                          ></video>
                        );
                        const nameEl = document.getElementById(
                          `${remoteProducer.from}-name`
                        );
                        nameEl.style.display = nameDisplay;

                        remoteProducer.videoStreamObject = consumerData;
                        socket.emit("consumerResume", {
                          fromId: remoteProducer.from,
                          type,
                          accessKey,
                          socketId,
                          userName,
                        });
                        const newStream = {
                          fromId: remoteProducer.from,
                          type,
                          track: remoteProducer.videoStreamObject.track,
                          component: videoEl,
                          name: remoteProducer.name,
                        };

                        const oldStreams = remoteStreams;
                        oldStreams.push(newStream);

                        const overWrite = [...oldStreams];

                        setRemoteStream(overWrite);
                        if (remoteProducer?.action !== "pause") {
                          toast.success(
                            `receiving ${type} stream from ${remoteProducer.name}`
                          );
                        }
                      }
                      if (remoteProducer.kind === "audio" && type === "audio") {
                        let muted = false;
                        if (remoteProducer?.action === "pause") {
                          muted = true;
                        }
                        const audioEl = (
                          <audio
                            className="audioElem"
                            id={`${remoteProducer.from}-audio`}
                            key={remoteProducer.from}
                            autoPlay
                            muted={muted}
                            playsInline
                          ></audio>
                        );
                        remoteProducer.audioStreamObject = consumerData;
                        socket.emit("consumerResume", {
                          fromId: remoteProducer.from,
                          type,
                          accessKey,
                          socketId,
                          userName,
                        });
                        const newStream = {
                          fromId: remoteProducer.from,
                          type,
                          track: remoteProducer.audioStreamObject.track,
                          component: audioEl,
                        };

                        const oldStreams = remoteStreams;
                        oldStreams.push(newStream);

                        const overWrite = [...oldStreams];

                        setRemoteStream(overWrite);
                        if (remoteProducer?.action !== "pause") {
                          toast.success(
                            `receiving ${type} stream from ${remoteProducer.name}`
                          );
                        }
                      }
                      // console.log(remoteMediaStreams);

                      if (
                        remoteProducer.kind === "screen" &&
                        type === "screen" &&
                        remoteProducer.action === "play"
                      ) {
                        const videoEl = (
                          <video
                            className="videoPlayer"
                            id={`${remoteProducer.from}-screen`}
                            key={remoteProducer.from}
                            autoPlay
                            playsInline
                          ></video>
                        );

                        remoteProducer.screenStreamObject = consumerData;
                        socket.emit("consumerResume", {
                          fromId: remoteProducer.from,
                          type,
                          accessKey,
                          socketId,
                          userName,
                        });
                        const newStream = {
                          fromId: remoteProducer.from,
                          type,
                          track: remoteProducer.screenStreamObject.track,
                          component: videoEl,
                        };

                        const oldStreams = remoteStreams;
                        oldStreams.push(newStream);

                        const overWrite = [...oldStreams];

                        setRemoteStream(overWrite);
                        if (remoteProducer?.action !== "pause") {
                          toast.success(
                            `receiving ${type} stream from ${remoteProducer.name}`
                          );
                        }
                      }
                    }
                  }
                );
              }
            }
          );
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const onParticipantLeft = (
  remoteVideoProducers,
  remoteAudioProducers,
  remoteScreenProducers,
  accessKey,
  userName,
  socketId,
  socket,
  participantsList,
  setParticipantsList
) => {
  return (data) => {
    try {
      console.log("participantLeft id: ", data.participantId);
      const videoEl = document.getElementById(`${data.participantId}-video`);
      const audioEl = document.getElementById(`${data.participantId}-audio`);
      const screenEl = document.getElementById(`${data.participantId}-screen`);
      const nameEl = document.getElementById(`${data.participantId}-name`);

      if (videoEl) {
        videoEl.style.display = "none";
      }
      if (audioEl) {
        audioEl.style.display = "none";
      }
      if (screenEl) {
        screenEl.style.display = "none";
      }
      if (nameEl) {
        nameEl.style.display = "none";
      }

      console.log(videoEl);
      console.log(audioEl);
      console.log(screenEl);
      console.log(nameEl);

      if (
        remoteVideoProducers[data.participantId] ||
        remoteAudioProducers[data.participantId] ||
        remoteScreenProducers[data.participantId]
      ) {
        socket.emit("deleteRcvTransport", {
          accessKey,
          userName,
          socketId,
          participantId: data.participantId,
        });
      }
      let name =
        remoteVideoProducers[data.participantId]?.name ||
        remoteAudioProducers[data.participantId]?.name ||
        "someone";

      if (remoteVideoProducers[data.participantId]) {
        delete remoteVideoProducers[data.participantId];
        console.log(remoteVideoProducers);
      }
      if (remoteAudioProducers[data.participantId]) {
        delete remoteAudioProducers[data.participantId];
        console.log(remoteAudioProducers);
      }
      if (remoteScreenProducers[data.participantId]) {
        delete remoteScreenProducers[data.participantId];
        console.log(remoteScreenProducers);
      }
      for (let i = 0; i < participantsList.length; i++) {
        if (participantsList[i].participantId === data.participantId) {
          console.log("removed from list: ", participantsList[i].participantId);
          participantsList.splice(i, 1);
        }
      }
      setParticipantsList([...participantsList]);
      toast.error(`${name} left the room`);
    } catch (error) {
      console.log(error.message);
    }
  };
};

const onStoppedScreen = (
  remoteScreenProducers,
  setConsumeScreenState,
  setScreenReset
) => {
  return (data) => {
    try {
      console.log("stopped sharing screen for id: ", data.participantId);
      const screenEl = document.getElementById(`${data.participantId}-screen`);
      if (screenEl) {
        screenEl.style.display = "none";
      }
      console.log(screenEl);
      if (remoteScreenProducers[data.participantId]) {
        setConsumeScreenState("");
        setScreenReset(data.participantId);
        let name = remoteScreenProducers[data.participantId].name;
        delete remoteScreenProducers[data.participantId];
        toast.error(`${name} stopped sharing screen`);
      }
    } catch (error) {
      console.log(error.message);
    }
  };
};

const onIncomingMessage = (messages, setMessages) => {
  return (data) => {
    try {
      console.log(data);
      const msgObj = data.msgObj;
      msgObj.type = "received";
      messages.push(msgObj);
      const newMessages = messages;
      setMessages([...newMessages]);
    } catch (error) {
      console.log(error.message);
    }
  };
};

const ontoggleRemoteMedia = () => {
  return (data) => {
    console.log(data, "mute");
    const remoteMediaEl = document.getElementById(`${data.id}-${data.type}`);
    const nameEl = document.getElementById(`${data.id}-name`);

    if (remoteMediaEl) {
      if (data.action === "play") {
        remoteMediaEl.play();
        remoteMediaEl.style.display = "block";
        if (nameEl && data.type === "video") {
          nameEl.style.display = "none";
        }
        if (data.type === "audio") {
          remoteMediaEl.muted = false;
        }
        //set remote name or video depedning on remote camera state
        // alert(`${data.type} stream for ${data.id} has been unmuted`);
        toast.success(`${data.type} for ${data.name} stream been unmuted`);
      }
      if (data.action === "pause") {
        remoteMediaEl.style.display = "none";
        remoteMediaEl.pause();
        if (nameEl && data.type === "video") {
          nameEl.style.display = "block";
        }
        if (data.type === "audio") {
          remoteMediaEl.muted = true;
        }
        toast.error(`${data.type} for ${data.name} stream been muted`);
        // alert(`${data.type} stream for ${data.id} has been muted`);
      }
    }
  };
};
export {
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
};
