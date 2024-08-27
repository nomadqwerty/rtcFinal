import { FullRtc } from "../../components/FullRTC/FullRtc";
import { Suspense } from "react";

import Link from "next/link";

export default function Rtc() {
  return (
    <Suspense>
      <FullRtc></FullRtc>
    </Suspense>
  );
}
