"use client";
import { Placeholder } from "react-bootstrap";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <Placeholder animation="glow">
      <Placeholder xs={6} />
    </Placeholder>
  );
}
