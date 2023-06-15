import React, { useState } from "react";
import { useCreateAsset, useUpdateAsset } from "@livepeer/react";
import Client from "livepeer-client";

interface IProps {
  livepeerClient: Client;
}
export const AssetsCreator = ({ livepeerClient }: IProps) => {
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState<any>(null);
  const [fileInput, setFileInput] = useState<any>(null);
  const { mutateAsync: createAssetAsync } = useCreateAsset(
    fileInput
      ? {
          sources: [{ name: fileInput.name, file: fileInput }],
        }
      : null
  );

  const { mutateAsync: updateAssetAsync } = useUpdateAsset(
    asset
      ? {
          assetId: asset.id,
          storage: { ipfs: true },
        }
      : null
  );

  const handleFileUpload = async () => {
    // stream name input check empty
    if (!fileInput) throw new Error("Please select a file");
    try {
      setLoading(true);
      const asset = await createAssetAsync();
      console.log("created asset:", asset);
      if(!asset) {
        throw new Error('Asset undefined');
      }
      const res = await livepeerClient.createAssetMetaStream(asset[0]);
      console.log("livepeerClient createAssetMetaStream res: ", res);
      setAsset(asset[0]);
      console.log("File uploaded successfully");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error while uploading file:", err);
    }
  };

  const uploadFileToIpfs = async () => {
    // stream name input check empty
    if (!asset) throw new Error("Please create asset first");
    try {
      setLoading(true);
      const asset = await updateAssetAsync();
      console.log("updated asset:", asset);
      if(!asset) {
        throw new Error('Asset undefined');
      }
      const res = await livepeerClient.updateAssetMetaStream((asset as any)[0]);
      console.log("livepeerClient updateAssetMetaStream res: ", res);
      setAsset(asset);
      console.log("Asset saved to Ipfs successfully");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error while saving asset to Ipfs:", err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      <button onClick={handleFileUpload} disabled={loading}>
        UploadToLivepeer
      </button>
      <button onClick={uploadFileToIpfs} disabled={loading}>
        UploadFileToIpfs
      </button>
    </div>
  );
};
