"use client";
import { useEffect, useRef, useState } from "react";
import { Row, Col, Form } from "react-bootstrap";
import "./settings.css";

const Settings = ({ ...props }) => {
  const [devices, setDevices] = useState({ audio: [], video: [], output: [] });
  const [selectedAudio, setSelectedAudio] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("");
  const [testingDevice, setTestingDevice] = useState(null);
  const [testState, setTestState] = useState({
    audio: false,
    video: false,
    output: false,
  });

  const [videoTestOutput, setVideoTestOutput] = useState("");
  const [micTestOutput, setMicTestOutput] = useState("");
  const [speakerTestOutput, setSpeakerTestOutput] = useState("");
  // const audioOutputElement = useRef(null);
  const localUserVideoTestRef = useRef(null);
  const testStreamRef = useRef(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = deviceInfos.filter(
          (device) => device.kind === "audioinput"
        );
        const videoDevices = deviceInfos.filter(
          (device) => device.kind === "videoinput"
        );
        const outputDevices = deviceInfos.filter(
          (device) => device.kind === "audiooutput"
        );

        setDevices({
          audio: audioDevices,
          video: videoDevices,
          output: outputDevices,
        });
        if (audioDevices.length > 0) {
          setSelectedAudio(audioDevices[0].deviceId);
        }
        if (videoDevices.length > 0) {
          setSelectedVideo(videoDevices[0].deviceId);
        }
        if (outputDevices.length > 0) {
          setSelectedOutput(outputDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error fetching devices: ", error);
      }
    };
    getDevices();
    navigator.mediaDevices.addEventListener("devicechange", getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices);
    };
  }, []);

  const handleAudioChange = (event) => {
    setSelectedAudio(event.target.value);
  };

  const handleVideoChange = (event) => {
    setSelectedVideo(event.target.value);
  };

  const handleOutputChange = async (event) => {
    const newOutputDeviceId = event.target.value;
    setSelectedOutput(newOutputDeviceId);
  //   if (audioOutputElement.current && audioOutputElement.current.setSinkId) {
  //     audioOutputElement.current.setSinkId(newOutputDeviceId).catch((error) => {
  //       console.error("Error setting audio output device: ", error);
  //     });
  //   }
  };

  const startTest = async (kind, deviceId, deviceLabel) => {
    try {
      if (kind === "audioinput") {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        addTrackToStream(micStream.getAudioTracks()[0]);
        setMicTestOutput(`Microfoon testen: ${deviceLabel} ...`);
      } else if (kind === "videoinput") {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        addTrackToStream(videoStream.getVideoTracks()[0]);
        if (localUserVideoTestRef.current) {
          localUserVideoTestRef.current.srcObject = testStreamRef.current;
        }
        setVideoTestOutput(`Het testen van camera: ${deviceLabel}...`);
      } else if (kind === "audiooutput") {
        // Implement audio output test logic here
        const audioOutputStream = await navigator.mediaDevices.getUserMedia(
          {
            audio: {
            // deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
            output: deviceId ? { deviceId: {exact: deviceId} } : undefined, // Include the selected output device ID
          },
        
        }
        //   {
        //   audio: { deviceId: { exact: deviceId } },
        //   output: deviceId ? { deviceId: {exact: deviceId} } : undefined,
        // }
      
      );
        addTrackToStream(audioOutputStream.getAudioTracks()[0]);
        // const testAudio = new Audio("path/to/test/sound.mp3");
        // testAudio.play();
        setSpeakerTestOutput(`Luidspreker testen: ${deviceLabel}...`);
        // audioOutputElement.current = audioOutputStream;
      }
      setTestState((prevState) => ({ ...prevState, [kind]: true }));
    } catch (error) {
      console.error(`Error testing ${kind} device: `, error);
    }
  };

  const stopTest = (kind) => {
    if (kind === "audioinput") {
      removeTrackFromStream("audio");
      setMicTestOutput("Microfoontest gestopt.");
    } else if (kind === "videoinput") {
      removeTrackFromStream("video");
      setVideoTestOutput("Cameratest gestopt.");
    } else if (kind === "audiooutput") {
      removeTrackFromStream("output");
      setSpeakerTestOutput("Luidsprekertest gestopt.");
    }
    setTestState((prevState) => ({ ...prevState, [kind]: false }));
  };

  const handleTestButtonClick = (kind, deviceId, deviceLabel) => {
    if (testState[kind]) {
      stopTest(kind);
    } else {
      startTest(kind, deviceId, deviceLabel);
    }
  };

  const addTrackToStream = (track) => {
    if (!testStreamRef.current) {
      testStreamRef.current = new MediaStream();
    }
    testStreamRef.current.addTrack(track);
  };

  const removeTrackFromStream = (kind) => {
    if (testStreamRef.current) {
      const tracks = testStreamRef.current.getTracks();
      tracks.forEach((track) => {
        if (track.kind === kind) {
          track.stop();
          testStreamRef.current.removeTrack(track);
        }
      });
    }
    if (localUserVideoTestRef.current) {
      localUserVideoTestRef.current.srcObject = testStreamRef.current;
    }
  };

  return (
    <Row id="settings-wrapper">
      <Col>
        <div className="header-close-btn-wrapper">
          <i
            onClick={props.toggleSettings}
            className="bi bi-x-circle header-close-btn"
            title="Sluiten" //means close
          />
        </div>
      </Col>
      <Col className="side-bar-header">
        <div className="sidebar-title-wrapper">
          <h2 className="p-0 sidebar-title mb-0">Einstellungen</h2>
        </div>
      </Col>

      {/* Camera settings */}
      <Col className="mb-4">
        <p className="test-topic">Test Ihrer Kamera</p>
        <div className="mt-3 mb-3">
          <Form.Group controlId="videoSource">
            <Form.Select
              className="settings-select"
              title="Wählen Sie eine Videoquelle aus"
              value={selectedVideo}
              onChange={handleVideoChange}
            >
              {devices.video.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
        <video
          className="videoPlayer p-0 mb-2"
          id="settingsVideo"
          autoPlay
          playsInline
          muted={!testState.audioinput}
          ref={localUserVideoTestRef}
        ></video>
        <Row className="device-test-wrapper" xxs={1} xs={2}>
          <Col xs={3} className="p-0">
            <button
              type="button"
              title="Klicken Sie auf Start, um die Kamera zu testen"
              className="btn settings-start-button"
              onClick={() =>
                handleTestButtonClick(
                  "videoinput",
                  selectedVideo,
                  devices.video.find(
                    (device) => device.deviceId === selectedVideo
                  )?.label
                )
              }
            >
              {testState.videoinput ? "End" : "Start"}
            </button>
          </Col>
          <Col
            xs={9}
            className={`device-test-output-wrapper p-0 `}
            style={{
              borderColor: testState.videoinput
                ? "blue"
                : videoTestOutput.includes("Failed")
                ? "red"
                : "#3c3c3c",
            }}
          >
            <input
              id="videoTestOutput"
              value={videoTestOutput}
              placeholder="Klicken Sie auf Start, um die Kamera zu testen"
              className="device-test-output p-1 border-0"
              readOnly
            />
          </Col>
        </Row>
      </Col>

      {/* Loudspeaker settings */}
      <Col className="mb-4">
        <Row className="device-test-wrapper" xxs={1} xs={2}>
          <Col xs={12} className="p-0">
            <p className="test-topic">Test Ihrer Lautsprecher</p>
            <div className="mt-3 mb-3">
              <Form.Group controlId="outputSource">
                <Form.Select
                  className="settings-select"
                  value={selectedOutput}
                  onChange={handleOutputChange}
                >
                  {devices.output.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </Col>
          <Col xs={3} className="p-0">
            <button
              type="button"
              title="Klicken Sie auf Start, um den Lautsprecher zu testen"
              className="btn settings-start-button"
              onClick={() =>
                handleTestButtonClick(
                  "audiooutput",
                  selectedOutput,
                  devices.output.find(
                    (device) => device.deviceId === selectedOutput
                  )?.label
                )
              }
            >
              {testState.audiooutput ? "End" : "Start"}
            </button>
          </Col>
          <Col
            xs={9}
            className={`device-test-output-wrapper p-0`}
            style={{
              borderColor: testState.audiooutput
                ? "blue"
                : speakerTestOutput.includes("Failed")
                ? "red"
                : "#3c3c3c",
            }}
          >
            <input
              id="speakerTestOutput"
              value={speakerTestOutput}
              placeholder="Klicken Sie auf Start, um den Lautsprecher zu testen"
              className="device-test-output p-1 border-0"
              readOnly
            />
          </Col>
        </Row>
      </Col>

      {/* Microphone settings */}
      <Col className="mb-4">
        <Row className="device-test-wrapper" xxs={1} xs={2}>
          <Col xs={12} className="p-0">
            <p className="test-topic">Test Ihres Mikrofons</p>
            <div className="mt-3 mb-3">
              <Form.Group controlId="audioSource">
                <Form.Select
                  className="settings-select"
                  title="Wählen Sie eine Audioquelle aus"
                  value={selectedAudio}
                  onChange={handleAudioChange}
                >
                  {devices.audio.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </Col>
          <Col xs={3} className="p-0">
            <button
              type="button"
              title="Klicken Sie auf Start, um das Mikrofon zu testen"
              className="btn settings-start-button"
              onClick={() =>
                handleTestButtonClick(
                  "audioinput",
                  selectedAudio,
                  devices.audio.find(
                    (device) => device.deviceId === selectedAudio
                  )?.label
                )
              }
            >
              {testState.audioinput ? "End" : "Start"}
            </button>
          </Col>
          <Col
            xs={9}
            className={`device-test-output-wrapper p-0`}
            style={{
              borderColor: testState.audioinput
                ? "blue"
                : micTestOutput.includes("Failed")
                ? "red"
                : "#3c3c3c",
            }}
          >
            <input
              id="micTestOutput"
              value={micTestOutput}
              placeholder="Klicken Sie auf Start, um das Mikrofon zu testen"
              className="device-test-output p-1 border-0"
              readOnly
            />
          </Col>
        </Row>
      </Col>

      <Col>
        <Form>
          <div className="mb-3">
            <p className="test-topic">Weitere Optionen</p>
            <Form.Check
              type="checkbox"
              id="radio-check"
              className="text-muted"
              label="Hintergrund weichzeichnen"
            />
          </div>
        </Form>
      </Col>

      {/* <audio ref={audioOutputElement}></audio> */}
    </Row>
  );
};

export default Settings;
