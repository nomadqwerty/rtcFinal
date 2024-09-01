import React, { useEffect, useState, useRef, useImperativeHandle } from "react";
// import { Form } from "react-bootstrap";
import { Row, Col, Form } from "react-bootstrap";
import ListGroup from "react-bootstrap/ListGroup";
import Dropdown from "react-bootstrap/Dropdown";

import "./settings.css";

const Settings = ({ ...props }) => {
  const [toggleVideo, setToggleVideo] = useState(false);
  const [toggleAudio, setToggleAudio] = useState(false);

  const toggleTestMedia = (id) => {
    return () => {
      const mediaEl = document.getElementById(id);
      console.log(mediaEl.muted);
      if (mediaEl && mediaEl.srcObject) {
        if (!mediaEl.muted) {
          mediaEl.pause();
          mediaEl.muted = true;

          // alert("audio stream is muted");
          if (id === "test-video") {
            setToggleVideo(false);
            mediaEl.style.opacity = 0;
          }
          if (id === "test-audio") {
            setToggleAudio(false);
          }
        } else {
          mediaEl.play();
          mediaEl.muted = false;

          if (id === "test-video") {
            setToggleVideo(true);
          }
          if (id === "test-audio") {
            setToggleAudio(true);
          }
          mediaEl.style.opacity = 1;
        }
      }
    };
  };
  return (
    <Row id="settings-wrapper">
      <Col className="settings-topic mt-1 mb-3">
        <h1>Einstellungen</h1>
      </Col>

      <Col className="mb-4 camera-test-section">
        <p className="test-topic">Test Ihrer Kamera</p>

        <Col xs={9}>
          <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-basic">
              video devices
            </Dropdown.Toggle>

            <Dropdown.Menu>{props.videoList}</Dropdown.Menu>
          </Dropdown>
        </Col>

        <div
          className="videoPlayer_wrapper mb-3"
          style={{
            marginTop: "10px",
          }}
        >
          <video
            className="videoPlayer"
            id="test-video"
            autoPlay
            playsInline
            controls
          ></video>
        </div>

        <Row className="device-test-wrapper" xxs={1} xs={2}>
          <Col xs={3} className="p-0">
            <button
              //   id="test-device-button"
              type="button"
              title="Klicken Sie auf Start, um die Kamera zu testen"
              className="btn settings-start-button"
              onClick={toggleTestMedia("test-video")}
            >
              {toggleVideo ? "stop" : "Start"}
            </button>
          </Col>

          <Col
            xs={9}
            className={`device-test-output-wrapper p-0 
          ${
            props.isCameraOn && props.isCameraTest
              ? "border-primary"
              : !props.isCameraOn && props.isCameraTest
              ? "border-danger"
              : "border-1"
          }`}
          >
            <input
              id="videoTestOutput"
              placeholder="Klicken Sie auf Start, um die Kamera zu testen"
              className="device-test-output p-1 border-0"
              readOnly
            />
          </Col>
        </Row>
      </Col>

      <Col className="mb-5">
        <Row className="device-test-wrapper" xxs={1} xs={2}>
          <Col xs={12} className="p-0">
            <p className="test-topic">Test Ihrer Mikrofons</p>
            <Col xs={9}>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic">
                  audio devices
                </Dropdown.Toggle>

                <Dropdown.Menu>{props.audioList}</Dropdown.Menu>
              </Dropdown>
            </Col>
            <audio
              className="audioElem"
              id={`test-audio`}
              autoPlay
              playsInline
              muted={props.isStreamingAudio ? true : false}
              controls
              style={{
                marginTop: "10px",
              }}
            ></audio>
          </Col>
          <Col xs={3} className="p-0">
            <button
              title="Klicken Sie auf Start, um das Mikrofon zu testen"
              type="button"
              className="btn settings-start-button"
              onClick={toggleTestMedia("test-audio")}
            >
              {toggleAudio ? "stop" : "Start"}
            </button>
          </Col>

          <Col
            xs={9}
            className={`device-test-output-wrapper p-0 
          ${
            props.isMicOn && props.isMicTest
              ? "border-primary"
              : !props.isMicOn && props.isMicTest
              ? "border-danger"
              : "border-1"
          }`}
          >
            <input
              id="micTestOutput"
              placeholder="Klicken Sie auf Start, um das Mikrofon zu testen"
              className="device-test-output p-1 border-0"
              readOnly
            />
          </Col>
        </Row>
      </Col>

      <Col className="mb-4">
        <Row className="device-test-wrapper" xxs={1} xs={2}>
          <Col xs={12} className="p-0">
            <p className="test-topic">Test Ihrer Lautsprecher</p>
          </Col>
          <Col xs={3} className="p-0">
            <button
              //   id="test-device-button"
              type="button"
              title="Klicken Sie auf Start, um den Lautsprecher zu testen"
              className="btn settings-start-button"
            >
              Start
            </button>
          </Col>

          <Col xs={9}>
            <input
              id="speakerTestOutput"
              placeholder="Klicken Sie auf Start, um den Lautsprecher zu testen"
              className="device-test-output p-1 border-0"
              readOnly
            />
          </Col>
        </Row>
      </Col>

      <audio style={{ display: "none" }} />
    </Row>
  );
};

export default Settings;
