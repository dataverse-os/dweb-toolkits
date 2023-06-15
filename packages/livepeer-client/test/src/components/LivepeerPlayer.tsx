import React, { useState } from "react";
import { LivepeerConfig, Player, ReactClient } from "@livepeer/react";

interface IProps {
  reactClient: ReactClient;
}

export const LivepeerPlayer = ({ reactClient }: IProps) => {
  const [playbackId, setPlaybackId] = useState("");
  const submitPlaybackId = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <LivepeerConfig client={reactClient}>
      <form onSubmit={submitPlaybackId}>
        <input
          type="text"
          value={playbackId}
          placeholder={"Enter playback Id"}
          onChange={(event) => setPlaybackId(event.target.value)}
        />
        <button type="submit">Play</button>
      </form>
      {playbackId && (
        <Player
          title="Waterfalls"
          playbackId={playbackId}
          showPipButton
          showTitle={false}
          aspectRatio="16to9"
          controls={{
            autohide: 3000,
          }}
          theme={{
            borderStyles: { containerBorderStyle: "hidden" },
            radii: { containerBorderRadius: "10px" },
          }}
        />
      )}
    </LivepeerConfig>
  );
};
