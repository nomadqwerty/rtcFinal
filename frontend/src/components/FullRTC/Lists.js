import Dropdown from "react-bootstrap/Dropdown";

const mediaList = (remoteVideoStream) => {
  try {
    return remoteVideoStream.map((vid, i) => {
      console.log(vid);
      return (
        <div className="full-width" key={vid.fromId}>
          {vid.component}
        </div>
      );
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
          return screen.component;
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

const participantsCompList = (participantsList) => {
  return participantsList.map((participant, i) => {
    try {
      console.log(participant);
      return (
        <div
          key={i}
          id={`${participant.participantId}-name`}
          className="name-container"
        >
          <h1 className="participant-name">{participant.participantName}</h1>
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
};
