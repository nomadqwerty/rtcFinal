import toast from "react-hot-toast";

const createProducerDevices = async (
  producerDevices,
  roomRouterRtp,
  Device,
  setProducerDevices
) => {
  try {
    if (producerDevices === null) {
      console.log(roomRouterRtp);
      const devices = {};
      const newVideoDevice = new Device();
      const newAudioDevice = new Device();
      const newScreenDevice = new Device();

      devices.videoDevice = newVideoDevice;
      devices.audioDevice = newAudioDevice;
      devices.screenDevice = newScreenDevice;

      await devices.videoDevice.load({
        routerRtpCapabilities: roomRouterRtp.videoRtpCapabilities,
      });

      await devices.audioDevice.load({
        routerRtpCapabilities: roomRouterRtp.audioRtpCapabilities,
      });

      await devices.screenDevice.load({
        routerRtpCapabilities: roomRouterRtp.screenRtpCapabilities,
      });

      // TODO: set devices for each router.

      setProducerDevices(devices);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const producerTransportListeners = (
  accessKey,
  userName,
  socketId,
  producerTransports,
  socket
) => {
  try {
    console.log(producerTransports);

    // video TP: connect events
    producerTransports.videoProducerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await socket.emit("transport-connect", {
            dtlsParameters,
            producer: true,
            consumer: false,
            accessKey,
            userName,
            socketId,
            isVideo: true,
            isAudio: false,
            isScreen: false,
          });

          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          errback(error);
        }
      }
    );

    // TODO: audioTP
    producerTransports.audioProducerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await socket.emit("transport-connect", {
            dtlsParameters,
            producer: true,
            consumer: false,
            accessKey,
            userName,
            socketId,
            isVideo: false,
            isAudio: true,
            isScreen: false,
          });

          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          errback(error);
        }
      }
    );

    // TODO: screen TP
    producerTransports.screenProducerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await socket.emit("transport-connect", {
            dtlsParameters,
            producer: true,
            consumer: false,
            accessKey,
            userName,
            socketId,
            isVideo: false,
            isAudio: false,
            isScreen: true,
          });

          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          errback(error);
        }
      }
    );
    //////////////////////////////////////////////////
    //
    // video Producer: produce event
    producerTransports.videoProducerTransport.on(
      "produce",
      async (parameters, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await socket.emit(
            "transport-produce",
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
              producer: true,
              consumer: false,
              accessKey,
              userName,
              socketId,
              isVideo: true,
              isAudio: false,
              isScreen: false,
            },
            ({ id }) => {
              // Tell the transport that parameters were transmitted.
              console.log(id);
              callback(id);
            }
          );
        } catch (error) {
          errback(error);
        }
      }
    );

    // TODO: audio Producer
    producerTransports.audioProducerTransport.on(
      "produce",
      async (parameters, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await socket.emit(
            "transport-produce",
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
              producer: true,
              consumer: false,
              accessKey,
              userName,
              socketId,
              isVideo: false,
              isAudio: true,
              isScreen: false,
            },
            ({ id }) => {
              // Tell the transport that parameters were transmitted.
              console.log(id);
              callback(id);
            }
          );
        } catch (error) {
          errback(error);
        }
      }
    );

    // TODO: screen Producer
    producerTransports.screenProducerTransport.on(
      "produce",
      async (parameters, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await socket.emit(
            "transport-produce",
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
              producer: true,
              consumer: false,
              accessKey,
              userName,
              socketId,
              isVideo: false,
              isAudio: false,
              isScreen: true,
            },
            ({ id }) => {
              // Tell the transport that parameters were transmitted.
              console.log(id);
              callback(id);
            }
          );
        } catch (error) {
          errback(error);
        }
      }
    );
  } catch (error) {
    console.log(error.message);
  }
};

const produceVideoStream = (
  isStreamingVideo,
  videoParams,
  setIsStreamingVideo,
  producerTransports,
  selectedVideoDevice,
  socket,
  accessKey,
  setIsCameraOn,
  userName
) => {
  return async () => {
    let navigator = window.navigator;
    if (navigator?.mediaDevices) {
      try {
        if (isStreamingVideo === false) {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedVideoDevice.deviceId },
            audio: false,
          });
          // TODO: add local stream to local video object:
          console.log(videoStream);

          videoStream.getTracks().forEach((track) => {
            if (track.kind === "video") {
              const videoConstraints = track.getCapabilities();

              const height = videoConstraints.height.max * 0.8;
              const width = videoConstraints.width.max * 0.8;

              track.applyConstraints({
                height,
                width,
              });
              const vidParams = {
                track: track,
                ...videoParams,
              };
              // TODO: store producer and and track state
              producerTransports.videoProducerTransport.produce(vidParams);
              const videoEl = document.getElementById("local-video");
              const newVideoStream = new MediaStream([track]);
              videoEl.srcObject = newVideoStream;
            }
          });
          // alert("video stream has started");
          setIsStreamingVideo(true);
          setIsCameraOn(true);
          toast.success("video stream has started");
        } else {
          const videoEl = document.getElementById("local-video");
          console.log(videoEl.muted);
          if (!videoEl.muted) {
            videoEl.pause();
            videoEl.muted = true;
            socket.emit("toggleMedia", {
              id: socket.id,
              type: "video",
              accessKey,
              action: "pause",
              name: userName,
            });
            // alert("video stream is muted");
            setIsCameraOn(false);
            toast.error("video stream is muted");
          } else {
            videoEl.play();
            videoEl.muted = false;
            socket.emit("toggleMedia", {
              id: socket.id,
              type: "video",
              accessKey,
              action: "play",
              name: userName,
            });
            setIsCameraOn(true);
            toast.success("video stream is unmuted");
          }
        }
      } catch (err) {
        console.log(err.message);
      }
    }
  };
};

const produceAudioStream = (
  isStreamingAudio,
  audioParams,
  setIsStreamingAudio,
  producerTransports,
  selectedAudioDevice,
  socket,
  accessKey,
  setIsMicOn,
  userName
) => {
  return async () => {
    let navigator = window.navigator;
    if (navigator?.mediaDevices) {
      try {
        if (isStreamingAudio === false) {
          const { noiseSuppression } =
            navigator.mediaDevices.getSupportedConstraints();

          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { deviceId: selectedAudioDevice.deviceId },
          });
          // TODO: add local stream to local video object:
          console.log(audioStream);
          audioStream.getTracks().forEach((track) => {
            if (track.kind === "audio") {
              track.applyConstraints({
                noiseSuppression,
              });
              const audParams = {
                track: track,
                ...audioParams,
              };
              // TODO: store producer and and track state
              producerTransports.audioProducerTransport.produce(audParams);
              const audioEl = document.getElementById("local-audio");
              audioEl.streaming = true;

              console.log(audioEl.streaming);
              const newAudioStream = new MediaStream([track]);
              audioEl.srcObject = newAudioStream;
            }
          });
          // alert("audio stream has started");
          setIsStreamingAudio(true);
          setIsMicOn(true);
          toast.success("audio stream has started");
        } else {
          const audioEl = document.getElementById("local-audio");
          console.log(audioEl.streaming);

          if (audioEl.streaming) {
            audioEl.pause();
            audioEl.streaming = false;
            socket.emit("toggleMedia", {
              id: socket.id,
              type: "audio",
              accessKey,
              action: "pause",
              name: userName,
            });
            // alert("audio stream is muted");
            setIsMicOn(false);
            toast.error("audio stream is muted");
          } else {
            audioEl.play();
            audioEl.streaming = true;
            socket.emit("toggleMedia", {
              id: socket.id,
              type: "audio",
              accessKey,
              action: "play",
              name: userName,
            });
            setIsMicOn(true);
            toast.success("audio stream is unmuted");
          }
        }
      } catch (err) {
        console.log(err.message);
      }
    }
  };
};

const produceScreenStream = (
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
) => {
  return async () => {
    setScreenReset("");
    let navigator = window.navigator;
    if (navigator?.mediaDevices) {
      try {
        if (
          isStreamingScreen === false &&
          (isStreamingAudio === true || isStreamingVideo === true)
        ) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia();
          // TODO: add local stream to local video object:
          const localScreen = document.getElementById("local-screen");
          console.log(screenStream);
          screenStream.getTracks().forEach((track) => {
            if (track.kind === "video") {
              const videoConstraints = track.getCapabilities();
              const newVideoStream = new MediaStream([track]);
              if (localScreen) {
                localScreen.srcObject = newVideoStream;
              }

              const height = videoConstraints.height.max * 0.8;
              const width = videoConstraints.width.max * 0.8;

              track.applyConstraints({
                height,
                width,
              });

              track.onended = () => {
                console.log("stopped sharing");
                setIsStreamingScreen(false);
                setIsScreenSharing(false);
                toast.error("stopped screen share");
                socket.emit("stoppedScreenShare", {
                  accessKey,
                  userName,
                  socketId,
                });
              };
              const screenParams = {
                track: track,
                ...videoParams,
              };
              // TODO: store producer and and track state
              producerTransports.screenProducerTransport.produce(screenParams);
            }
          });
          setIsStreamingScreen(true);
          setIsScreenSharing(true);
          toast.success("started screen share");
        } else {
          if (
            isStreamingScreen === false &&
            isStreamingAudio === false &&
            isStreamingVideo === false
          ) {
            toast.error("to share screen, start video or audio");
          } else if (isStreamingScreen === true) {
            toast.error("already sharing screen");
          }
        }
      } catch (err) {
        console.log(err.message);
      }
    }
  };
};

export {
  createProducerDevices,
  producerTransportListeners,
  produceVideoStream,
  produceAudioStream,
  produceScreenStream,
};
