import ListGroup from "react-bootstrap/ListGroup";

const mediaList = (remoteVideoStream) => {
  try {
    return remoteVideoStream.map((vid, i) => {
      return vid.component;
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
      console.log(screen);
      if (!showing[screen.fromId]) {
        showing[screen.fromId] = screen;
        return screen.component;
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
        <ListGroup.Item key={i}>
          <li onClick={onSetMediaDevice(i, setSelectedMediaDevice)} key={i}>
            {device.label}
          </li>
        </ListGroup.Item>
      );
    } catch (error) {
      console.log(error.message);
      return <></>;
    }
  });
};

export { mediaList, screenArray, messagesArray, mediaDeviceList };
