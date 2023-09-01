import { abbreviateAddress } from "../../utils";
import React from "react";
import "./index.scss";
import { CredentialInfo, SismoGroupInfo } from "@dataverse/sismo-client";

interface IProps {
  address?: string;
  credentialInfoList?: CredentialInfo[];
  groupInfoList?: SismoGroupInfo[];
}

const Profile = ({ address, credentialInfoList, groupInfoList }: IProps) => {
  const hasReputation = (groupId: string) => {
    const filterArr = credentialInfoList?.filter(
      reputationInfo =>
        reputationInfo.groupId === groupId && reputationInfo.value === true,
    );
    if (filterArr && filterArr.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <div className='profile'>
      <div className='profile__address'>
        <h4>Address</h4>
        {address ? abbreviateAddress(address) : ""}
      </div>
      <div className='profile__reputations'>
        <h4>Credentials</h4>
        {groupInfoList?.map((groupInfo: SismoGroupInfo, index) => {
          return (
            <div className='profile__reputations-item' key={index}>
              <div className='name'>{`${
                hasReputation(groupInfo.id) ? "✅" : "❌"
              } ${groupInfo.name}`}</div>
              <div className='group-id'>{groupInfo.id}</div>
              <div className='description'>{groupInfo.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { Profile };
