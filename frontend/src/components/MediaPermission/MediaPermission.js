import React from "react";
import Image from "next/image";
import { Row, Col } from "react-bootstrap";
import "./mediapermission.css";

export const MediaPermission = () => {
  return (
    <Row className="mediaPermissionContainer">
      <Col className="permission-error-div">
        <div className="permission-image-div">
          <Image
            width={640}
            height={480}
            src="/images/media-permission.svg"
            alt="media devices not allowed"
            className="error-image"
          />
        </div>

        <div className="permission-message-div">
          <h1>Zugriff auf Mikrofon und Kamera erlauben</h1>
          <p className="text-muted w-75 m-auto">
            Bitte klicken Sie in der Adressleiste Ihres Browsers auf das
            angezeigte Symbol und aktivieren Sie Ihr Mikrofon und Ihre Kamera.
          </p>
        </div>
      </Col>
    </Row>
  );
};
