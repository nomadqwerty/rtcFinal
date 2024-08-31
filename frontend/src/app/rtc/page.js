import { FullRtc } from "../../components/FullRTC/FullRtc";
import { Suspense } from "react";

export default function Rtc() {
  return (
    <Suspense>
      <FullRtc></FullRtc>
    </Suspense>
  );
}
