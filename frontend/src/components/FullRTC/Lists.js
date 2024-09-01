import Dropdown from "react-bootstrap/Dropdown";
import toast from "react-hot-toast";

const mediaList = (remoteVideoStream) => {
  try {
    return remoteVideoStream.map((vid, i) => {
      console.log(vid);

      const nameTag = document.getElementById(`${vid.fromId}-name`);
      const nameHeader = document.getElementById(`${vid.fromId}-header`);
      const vidTag = document.getElementById(`${vid.fromId}-video`);
      const audTag = document.getElementById(`${vid.fromId}-audio`);

      if (nameTag) {
        if (!vidTag && vid.type === "video") {
          const videoEl = document.createElement("video");
          videoEl.setAttribute("id", `${vid.fromId}-video`);
          videoEl.className = "videoPlayer p-0 user2 remote";
          videoEl.autoplay = true;
          console.log(nameTag);
          console.log(vidTag);
          console.log(vid.action);
          nameTag.appendChild(videoEl);
          if (vid.action === "play" || !vid.action) {
            videoEl.style.display = "block";
            nameHeader.style.display = "none";
            videoEl.isMuted = false;
          } else {
            videoEl.style.display = "none";
            nameHeader.style.display = "block";
            videoEl.isMuted = true;
          }
        }
        if (!audTag && vid.type === "audio") {
          const audioEl = document.createElement("audio");
          audioEl.setAttribute("id", `${vid.fromId}-audio`);
          audioEl.autoplay = true;
          if (vid.action === "play" || !vid.action) {
          } else {
            audioEl.pause();
          }

          nameTag.appendChild(audioEl);
        }
      }
    });
  } catch (error) {
    console.log(error.message);
    return <></>;
  }
};

const screenArray = (remoteScreenStream) => {
  try {
    let showing = {};
    return remoteScreenStream.map((screen, i) => {
      if (!showing[screen.fromId]) {
        showing[screen.fromId] = screen;

        if (screen.track.muted === false) {
          const nameTag = document.getElementById(`${screen.fromId}-name`);
          const nameHeader = document.getElementById(`${screen.fromId}-header`);
          const vidTag = document.getElementById(`${screen.fromId}-video`);
          const screenTag = document.getElementById(`${screen.fromId}-screen`);

          if (nameTag) {
            if (!screenTag && screen.type === "screen") {
              const screenEl = document.createElement("video");
              screenEl.setAttribute("id", `${screen.fromId}-screen`);
              screenEl.className = "videoPlayer p-0 user2 remote";
              screenEl.autoplay = true;
              console.log(nameTag);
              screenEl.isStopped = false;

              nameTag.appendChild(screenEl);
              console.log(nameTag, nameHeader, vidTag);
              console.log(screen.action);
              if (screen.action === "play" || !screen.action) {
                screenEl.style.display = "block";
                vidTag.style.display = "none";
                nameHeader.style.display = "none";
                console.log(nameHeader.style.display);
              } else {
                screenEl.style.display = "none";
                vidTag.style.display = "none";
                nameHeader.style.display = "block";
              }
              return;
            }
          }
        } else {
          return <></>;
        }
      } else {
        delete showing[screen.fromId];
        return <></>;
      }
    });
  } catch (error) {
    console.log(error.message);
    return <></>;
  }
};

const messagesArray = (messages, userName) => {
  try {
    return messages.map((message, i) => {
      return (
        <li
          key={message.timeWithMilliseconds}
          className={`msgItem mb-1 ${
            message.type === "send" ? "right" : "left"
          }`}
        >
          <p
            className={`m-0 mb-1 clientNameDate ${
              message.type === "send" ? "right" : "left"
            }`}
          >
            <span className="clientName"> {message.from} </span>
            <span className="chatTimeStamp">{message.time} </span>
          </p>
          <p
            className={`msg m-0 ${message.type === "send" ? "right" : "left"}`}
          >
            {message.message}
          </p>
        </li>
      );
    });
  } catch (error) {
    console.log(error.message);
    return <></>;
  }
};

const mediaDeviceList = (devices, onSetMediaDevice, setSelectedMediaDevice) => {
  return devices.map((device, i) => {
    try {
      return (
        <Dropdown.Item key={i}>
          {" "}
          <li onClick={onSetMediaDevice(i, setSelectedMediaDevice)}>
            {device.label}
          </li>
        </Dropdown.Item>
      );
    } catch (error) {
      console.log(error.message);
      return <></>;
    }
  });
};

const participantDropDown = (participants) => {
  const togglePeer = (id) => {
    return () => {
      console.log(id);
      console.log(participants);
      for (let i = 0; i < participants.length; i++) {
        if (participants[i].participantId === id) {
          console.log(id);
          const nameTag = document.getElementById(`${id}-name`);

          nameTag.style.display = "block";
          toast.success(`now viewing ${participants[i].participantName}`);
        } else {
          const nameTag = document.getElementById(
            `${participants[i].participantId}-name`
          );

          nameTag.style.display = "none";
        }
      }
    };
  };
  return participants.map((participant, i) => {
    try {
      return (
        <Dropdown.Item key={i}>
          {" "}
          <li onClick={togglePeer(participant.participantId)}>
            {participant.participantName}
          </li>
        </Dropdown.Item>
      );
    } catch (error) {
      console.log(error.message);
      return <></>;
    }
  });
};

const participantsCompList = (participantsList) => {
  return participantsList.map((participant, i) => {
    try {
      console.log(participant);
      return (
        <div
          key={i}
          id={`${participant.participantId}-name`}
          className="name-container"
          style={{ display: "block" }}
        >
          <div
            title="Anzeige umschalten"
            className="control-container"
            id="leave-call-btn"
            style={{
              position: "absolute",
              padding: "10px",
              zIndex: "10",
              left: "95vw",
            }}
          >
            <img
              className="icon"
              src="/icons/server.svg"
              alt="leave call button"
              onClick={() => {
                const videoEl = document.getElementById(
                  `${participant.participantId}-video`
                );
                let screenEl = document.getElementById(
                  `${participant.participantId}-screen`
                );
                const nameEl = document.getElementById(
                  `${participant.participantId}-header`
                );

                if (videoEl && screenEl) {
                  console.log(videoEl, screenEl.isStopped);
                  if (
                    videoEl.style.display === "none" &&
                    screenEl.style.display === "block"
                  ) {
                    if (videoEl.isMuted) {
                      nameEl.style.display = "block";
                      screenEl.style.display = "none";
                    } else {
                      videoEl.style.display = "block";
                      nameEl.style.display = "none";
                      screenEl.style.display = "none";
                    }
                    toast.success(`${participant.participantName}'s camera`);
                  } else if (screenEl.style.display === "none") {
                    if (screenEl.isStopped) {
                      if (videoEl.isMuted) {
                        videoEl.style.display = "none";
                        nameEl.style.display = "block";
                      } else {
                        videoEl.style.display = "block";
                        nameEl.style.display = "none";
                      }
                      screenEl.style.display = "none";
                      toast(`cannot switch media`);
                    } else if (!screenEl.isStopped) {
                      screenEl.style.display = "block";
                      videoEl.style.display = "none";
                      nameEl.style.display = "none";
                      toast.success(`${participant.participantName}'s screen`);
                    }
                  } else {
                    toast(`cannot switch media`);
                  }
                } else {
                  toast(`cannot switch media`);
                }
              }}
            />
          </div>
          <h1
            className="participant-name"
            id={`${participant.participantId}-header`}
          >
            {participant.participantName}
          </h1>
        </div>
      );
    } catch (error) {
      console.log(error.message);
      return <></>;
    }
  });
};

export {
  mediaList,
  screenArray,
  messagesArray,
  mediaDeviceList,
  participantsCompList,
  participantDropDown,
};
