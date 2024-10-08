import toast from "react-hot-toast";
const getUserMedia = async (
  navigator,
  setSocketId,
  setSocket,
  socketObj,
  setVideoDevices,
  setAudioDevices,
  setIsMediaGranted,
  setSpeakerDevices
) => {
  const permissionContainer = document.getElementById(
    "mediaPermissionContainer"
  ); // permissiond div
  if (navigator.mediaDevices) {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if (media) {
        media.getTracks().forEach((track) => {
          if (track.kind === "video") {
            const videoEl = document.getElementById("local-video");
            const screenEl = document.getElementById("local-screen");
            screenEl.style.display = "none";
            const newVideoStream = new MediaStream([track]);
            if (videoEl) {
              videoEl.srcObject = newVideoStream;
            }
          }
          if (track.kind === "audio") {
            const audioEl = document.getElementById("local-audio");
            const newAudioStream = new MediaStream([track]);
            if (audioEl) {
              audioEl.srcObject = newAudioStream;
            }
          }
        });
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = [];
        const audioDevices = [];
        const audioSpeakers = [];
        for (let i = 0; i < mediaDevices.length; i++) {
          if (mediaDevices[i].kind === "videoinput") {
            videoDevices.push(mediaDevices[i]);
          }
          if (mediaDevices[i].kind === "audioinput") {
            audioDevices.push(mediaDevices[i]);
          }
          if (mediaDevices[i].kind === "audiooutput") {
            audioSpeakers.push(mediaDevices[i]);
          }
        }

        setVideoDevices([...videoDevices]);
        setAudioDevices([...audioDevices]);
        setSpeakerDevices([...audioSpeakers]);

        setSocketId(socketObj.id);
        setSocket(socketObj);
        // set permissions to true
        setIsMediaGranted(true);
        if (permissionContainer) {
          permissionContainer.style.display = "none";
        }
      } else {
        setIsMediaGranted(false);
        if (permissionContainer) {
          permissionContainer.style.display = "block";
        }
        // set permissions to false
      }
    } catch (error) {
      console.log(error.message);
      if (permissionContainer) {
        permissionContainer.style.display = "block";
      }
      if (error.message === "Permission denied") {
        if (permissionContainer) {
          permissionContainer.style.display = "block";
        }
        toast.error("Media device permissions denied");
        // set media-permissions state to false
        setIsMediaGranted(false);

        if (permissionContainer) {
          permissionContainer.style.display = "block";
        }
      }
      // set media-permissions state set to false
    }
  }
};

const onTypeMessage = (setMessageInput) => {
  return (e) => {
    try {
      setMessageInput(e.target.value);
    } catch (error) {
      console.log(error.message);
    }
  };
};

//function to get & format local user time
let getTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

let getTimeWithMilliseconds = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const mseconds = now.getMilliseconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${mseconds}`;
};

const onSendMessage = (
  accessKey,
  socketId,
  messageInput,
  setMessageInput,
  userName,
  messages,
  setMessages,
  socket
) => {
  return (e) => {
    try {
      e.preventDefault();

      if (messageInput.length > 0) {
        const msgObj = {
          time: getTime(),
          timeWithMilliseconds: getTimeWithMilliseconds(),
          message: messageInput,
          type: "send",
          from: userName,
        };
        messages.push(msgObj);
        const newMessages = messages;
        setMessages([...newMessages]);
        console.log(msgObj);
        socket.emit("newMessage", {
          userName,
          accessKey,
          socketId,
          msgObj,
        });
        setMessageInput("");
        document.getElementById("msgInput").value = "";
      }
    } catch (error) {
      console.log(error.message);
    }
  };
};

const addVideoStream = (videoEls) => {
  try {
    if (videoEls.length > 0) {
      console.log(videoEls);
      for (let i = 0; i < videoEls.length; i++) {
        if (!videoEls[i]?.isLoaded) {
          const videoEl = document.getElementById(
            `${videoEls[i].fromId}-video`
          );
          console.log(videoEl);
          console.log(`${videoEls[i].fromId}-video`);
          const videoFeed = new MediaStream([videoEls[i].track]);

          videoEl.srcObject = videoFeed;
          videoEls[i].isLoaded = true;
          console.log(videoEl.srcObject);
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addAudioStream = (audioEls) => {
  try {
    if (audioEls.length > 0) {
      console.log(audioEls);
      for (let i = 0; i < audioEls.length; i++) {
        if (!audioEls[i]?.isLoaded) {
          const audioEl = document.getElementById(
            `${audioEls[i].fromId}-audio`
          );
          console.log(`${audioEls[i].fromId}-audio`);
          const audioFeed = new MediaStream([audioEls[i].track]);
          console.log(audioEl);
          audioEl.srcObject = audioFeed;
          audioEls[i].isLoaded = true;
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addScreenStream = (screenEls) => {
  try {
    if (screenEls.length > 0) {
      console.log(screenEls);
      for (let i = 0; i < screenEls.length; i++) {
        if (!screenEls[i]?.isLoaded) {
          const screenEl = document.getElementById(
            `${screenEls[i].fromId}-screen`
          );
          console.log(screenEl);
          const nameEl = document.getElementById(
            `${screenEls[i].fromId}-header`
          );
          const videoEl = document.getElementById(
            `${screenEls[i].fromId}-video`
          );
          nameEl.style.display = "none";
          videoEl.style.display = "none";
          screenEl.style.display = "block";
          console.log(`${screenEls[i].fromId}-screen`);
          screenEl.isStopped = false;
          const videoFeed = new MediaStream([screenEls[i].track]);

          screenEl.srcObject = videoFeed;
          screenEls[i].isLoaded = true;
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetScreen = (
  screenReset,
  screenEls,
  setScreenEls,
  setRemoteScreenStream
) => {
  try {
    if (screenReset.length > 0) {
      console.log(screenEls);
      let idx;
      for (let i = 0; i < screenEls.length; i++) {
        console.log(screenEls[i], screenReset);
        if (screenEls[i].fromId === screenReset) {
          idx = i;
        }
      }

      if (idx || idx === 0) {
        screenEls.splice(idx, 1);
        console.log(screenEls, idx);
        setRemoteScreenStream([...screenEls]);
        setScreenEls([...screenEls]);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
const testUserMedia = async (navigator, videoDevice, audioDevice, type) => {
  if (navigator.mediaDevices) {
    try {
      console.log(type);
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: audioDevice.deviceId },
        video: { deviceId: videoDevice.deviceId },
      });

      media.getTracks().forEach((track) => {
        if (track.kind === "video" && type === "video") {
          const videoEl = document.getElementById("test-video");
          const newVideoStream = new MediaStream([track]);
          videoEl.srcObject = newVideoStream;
        }
        if (track.kind === "audio" && type === "audio") {
          const audioEl = document.getElementById("test-audio");
          const newAudioStream = new MediaStream([track]);
          audioEl.srcObject = newAudioStream;
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  }
};

const onSetVideoDevice = (idx, setSelectedVideoDevice) => {
  try {
    return (e) => {
      setSelectedVideoDevice(idx);
      console.log(idx);
    };
  } catch (error) {
    console.log(error.message);
  }
};
const onSetAudioDevice = (idx, setSelectedAudioDevice) => {
  try {
    return (e) => {
      setSelectedAudioDevice(idx);
    };
  } catch (error) {
    console.log(error.message);
  }
};
const onSetSpeakerDevice = (idx, setSelectedSpeakerDevice) => {
  try {
    return (e) => {
      setSelectedSpeakerDevice(idx);
    };
  } catch (error) {
    console.log(error.message);
  }
};

const stopTesting = (setSelectedVideoDevice, setSelectedAudioDevice) => {
  return () => {
    try {
      const videoEl = document.getElementById(`test-video`);
      const audioEl = document.getElementById(`test-audio`);

      if (videoEl) {
        videoEl.srcObject = null;
      }
      if (audioEl) {
        audioEl.srcObject = null;
      }
      setSelectedVideoDevice(null);
      setSelectedAudioDevice(null);
    } catch (error) {
      console.log(error.message);
    }
  };
};
export {
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
  onSetSpeakerDevice,
  stopTesting,
};
