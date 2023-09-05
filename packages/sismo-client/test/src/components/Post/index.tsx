import { abbreviateAddress } from "../../utils";
import React from "react";
import "./index.scss";
import { CredentialInfo, SismoGroupInfo } from "@dataverse/sismo-client";

interface IProps {
  address?: string;
  credentialInfoList?: CredentialInfo[];
  groupInfoList?: SismoGroupInfo[];
  text: string;
}

const Post = ({ address, credentialInfoList, groupInfoList, text }: IProps) => {
  const hasReputation = (groupId: string) => {
    const filterArr = credentialInfoList?.filter(
      (reputationInfo) =>
        reputationInfo.groupId === groupId && reputationInfo.value === true
    );
    if (filterArr && filterArr.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <div className="post">
      <header>
        <div className="post__address">
          🙎🏻‍♂️ {address ? abbreviateAddress(address) : ""}
        </div>
        <div className="post__reputations">
          {groupInfoList?.map((groupInfo: SismoGroupInfo, index) => {
            return (
              <div className="post__reputations-item" key={index}>
                <div className="name">{`${
                  hasReputation(groupInfo.id) ? "✅" : "❌"
                } ${groupInfo.name}`}</div>
              </div>
            );
          })}
        </div>
      </header>
      <div className="post_content">{text}</div>
    </div>
  );
};

export { Post };
