import Image from "next/image";
import styles from "./page.module.css";
// import HomePage from "@/Components/Homepage/Homepage";
import Link from "next/link";

export default function Home() {
  return (
  <>
    <Link href="/jitsi">
    Jitsi implementation</Link>
<br/>
    <Link href="/rtc">
    FULL RTC</Link>
    
  </>
    
  );
}
