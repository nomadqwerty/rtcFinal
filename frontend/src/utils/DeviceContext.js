// DeviceContext.js
"use client"
import { createContext, useContext, useState, useEffect, useRef } from 'react';

const DeviceContext = createContext();

export const useDevices = () => useContext(DeviceContext);

export const DeviceProvider = ({ children }) => {
  const [devices, setDevices] = useState({ audio: [], video: [], output: [] });
  const [selectedAudio, setSelectedAudio] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("");

  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = deviceInfos.filter(device => device.kind === "audioinput");
        const videoDevices = deviceInfos.filter(device => device.kind === "videoinput");
        const outputDevices = deviceInfos.filter(device => device.kind === "audiooutput");

        setDevices({
          audio: audioDevices,
          video: videoDevices,
          output: outputDevices,
        });
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

  return (
    <DeviceContext.Provider value={{
      devices,
      selectedAudio,
      setSelectedAudio,
      selectedVideo,
      setSelectedVideo,
      selectedOutput,
      setSelectedOutput,
    }}>
      {children}
    </DeviceContext.Provider>
  );
};
