import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import api from "../../services/api";
import Alert from "../feedback/Alert";
import LoadingSpinner from "../feedback/LoadingSpinner";
import Button from "../forms/Button";

function TrackTile({ track, identity }) {
  const mediaRef = useRef(null);
  useEffect(() => {
    const element = mediaRef.current;
    if (!element || !track) return undefined;
    track.attach(element);
    return () => track.detach(element);
  }, [track]);
  const video = String(track?.kind || "").toLowerCase() === "video";
  const MediaElement = video ? "video" : "audio";
  return <div className="relative overflow-hidden rounded-xl bg-slate-950"><MediaElement ref={mediaRef} autoPlay playsInline controls={false} className={video ? "h-48 w-full object-cover" : "w-full"} /><span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">{identity || "Room participant"}</span></div>;
}

export default function LiveRoomSession({ roomId, title, tokenPath, host = false, onLeave }) {
  const roomRef = useRef(null);
  const [tracks, setTracks] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    const syncRemoteTracks = () => {
      if (cancelled) return;
      const next = [];
      room.remoteParticipants.forEach((participant) => participant.trackPublications.forEach((publication) => {
        if (publication.track) next.push({ sid: publication.trackSid, track: publication.track, identity: participant.identity });
      }));
      setTracks(next);
    };
    const syncLocalTracks = () => {
      if (cancelled) return;
      const next = [];
      room.localParticipant.trackPublications.forEach((publication) => {
        if (publication.track && String(publication.kind || "").toLowerCase() === "video") next.push({ sid: publication.trackSid, track: publication.track, identity: "You" });
      });
      setLocalTracks(next);
    };
    const addTrack = (track, publication, participant) => {
      if (cancelled) return;
      setTracks((current) => [...current.filter((item) => item.sid !== publication.trackSid), { sid: publication.trackSid, track, identity: participant.identity }]);
    };
    const removeTrack = (track) => setTracks((current) => current.filter((item) => item.track !== track));
    room.on(RoomEvent.Connected, () => { setStatus("connected"); setMessage(host ? "You are connected as the supervised room host." : "Connected to the supervised room."); syncRemoteTracks(); syncLocalTracks(); });
    room.on(RoomEvent.Reconnecting, () => setStatus("reconnecting"));
    room.on(RoomEvent.Reconnected, () => { setStatus("connected"); setMessage("Connection restored."); });
    room.on(RoomEvent.Disconnected, () => { setStatus("disconnected"); setMessage("You left the room or the room was closed."); });
    room.on(RoomEvent.TrackSubscribed, addTrack);
    room.on(RoomEvent.TrackUnsubscribed, removeTrack);
    room.on(RoomEvent.ParticipantConnected, syncRemoteTracks);
    room.on(RoomEvent.ParticipantDisconnected, syncRemoteTracks);
    (async () => {
      try {
        const response = await api.post(tokenPath || `/student/live-rooms/${roomId}/token`);
        const tokenData = response?.data?.data;
        if (!tokenData?.token || !tokenData?.url) throw new Error("The server did not return a valid room token.");
        await room.connect(tokenData.url, tokenData.token, { autoSubscribe: true });
      } catch (reason) {
        if (!cancelled) { setStatus("error"); setError(reason?.message || "The room connection could not be started."); }
      }
    })();
    return () => { cancelled = true; room.removeAllListeners(); room.disconnect(); roomRef.current = null; };
  }, [roomId, tokenPath, host]);

  const leave = () => { roomRef.current?.disconnect(); onLeave?.(); };
  const toggleMedia = async (kind) => {
    const room = roomRef.current;
    if (!room || status !== "connected") return;
    try {
      if (kind === "camera") { const next = !cameraEnabled; await room.localParticipant.setCameraEnabled(next); setCameraEnabled(next); }
      if (kind === "microphone") { const next = !microphoneEnabled; await room.localParticipant.setMicrophoneEnabled(next); setMicrophoneEnabled(next); }
      if (kind === "screen") { const next = !screenShareEnabled; await room.localParticipant.setScreenShareEnabled(next); setScreenShareEnabled(next); }
      setError("");
      setMessage("Host media settings updated.");
      const local = [];
      room.localParticipant.trackPublications.forEach((publication) => { if (publication.track && String(publication.kind || "").toLowerCase() === "video") local.push({ sid: publication.trackSid, track: publication.track, identity: "You" }); });
      setLocalTracks(local);
    } catch (reason) { setError(reason?.message || "The browser could not change this media setting."); }
  };

  if (status === "loading") return <LoadingSpinner text="Requesting a secure room connection..." />;
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">{title || "Live learning room"}</h2><p className="text-sm text-slate-500">Status: {status}</p></div><Button variant="secondary" onClick={leave}>Leave room</Button></div>{error && <Alert variant="error">{error}</Alert>}{message && <Alert variant="info">{message}</Alert>}{status === "reconnecting" && <Alert variant="warning">Your connection is interrupted. DOONO is trying to reconnect; do not refresh unless the connection does not return.</Alert>}{host && status === "connected" && <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3"><Button size="sm" variant={cameraEnabled ? "primary" : "secondary"} onClick={() => toggleMedia("camera")}>{cameraEnabled ? "Turn camera off" : "Turn camera on"}</Button><Button size="sm" variant={microphoneEnabled ? "primary" : "secondary"} onClick={() => toggleMedia("microphone")}>{microphoneEnabled ? "Mute microphone" : "Unmute microphone"}</Button><Button size="sm" variant={screenShareEnabled ? "primary" : "secondary"} onClick={() => toggleMedia("screen")}>{screenShareEnabled ? "Stop screen share" : "Share screen"}</Button></div>}{status === "connected" && tracks.length === 0 && localTracks.length === 0 && <Alert variant="info">You are connected. No participant has published a track yet.</Alert>}<div className="grid gap-3 sm:grid-cols-2">{localTracks.map((item) => <TrackTile key={`local-${item.sid}`} track={item.track} identity={item.identity} />)}{tracks.map((item) => <TrackTile key={item.sid} track={item.track} identity={item.identity} />)}</div></section>;
}
