import React from "react";
import Image from "next/image";
import { Row, Col } from "react-bootstrap";
import "./mediapermission.css";

export const MediaPermission = () => {
  return (
    <Row xs={2} id="mediaPermissionContainer">
        <Col xs={2} className="control-image-div" >
        <Image
            width={300}
            height={200}
            src="/images/permission-control.svg"
            alt="media devices not allowed"
            className="control-image"
            loading="lazy"
          />
          </Col>
          
      <Col xs={10} className="permission-error-div">
        <div className="permission-image-div">

          <Image
            width={640}
            height={480}
            src="/images/media-permission.svg"
            alt="media devices not allowed"
            className="error-image"
            loading="lazy"
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
