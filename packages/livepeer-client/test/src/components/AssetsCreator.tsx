import React, { useState } from "react";
import Client from "@dataverse/livepeer-client-toolkit";

interface IProps {
  livepeerClient: Client;
  setStreamId: Function;
}
export const AssetsCreator = ({ livepeerClient, setStreamId }: IProps) => {
  const [loading, setLoading] = useState(false);
  const [fileInput, setFileInput] = useState<any>(null);

  const uploadVideo = async () => {
    if (!fileInput) throw new Error("Please select a file");
    try {
      setLoading(true);
      const res = await livepeerClient.uploadVideo(fileInput);
      console.log("File uploaded successfully, res:", res);
      setStreamId(res.streamId);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error while uploading file:", err);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileInput(files[0]);
    } else {
      setFileInput(null);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadVideo} disabled={loading}>
        UploadToLivepeer
      </button>
    </div>
  );
};
