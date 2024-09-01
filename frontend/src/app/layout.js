import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import React from "react";
import { Toaster } from "react-hot-toast";

//bootstrap imports
import BootstrapClient from "../utils/bootstrap/BootstrapClient";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
// import { SocketContext, socket } from "./context/SocketContext";
import { ConferenceProvider } from "../context/conference.context";
import { Container } from "react-bootstrap";
import Loading from "../components/loading";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Psymax",
  description: "Psymax video chat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head></head>
      <body className={inter.className}>
        <Suspense fallback={<Loading />}>
          <Container id="root" className="p-0 m-0" fluid>
            <Toaster position="top-center" />
            <ConferenceProvider>{children}</ConferenceProvider>
          </Container>
        </Suspense>
        <BootstrapClient />
      </body>
    </html>
  );
}
