import {RuntimeConnector} from "@dataverse/runtime-connector";
import {RuntimeConnectorSigner} from "@dataverse/utils-toolkit";
import {Client} from "@xmtp/xmtp-js";
import {XmtpEnv} from "./types";

export class XmtpClient {

  public appName: string;
  public runtimeConnector: RuntimeConnector;
  public signer: RuntimeConnectorSigner;
  public env: XmtpEnv

  public xmtp: Client | undefined
  // public modelIds: ModelIds;


  constructor({
                runtimeConnect,
                appName,
                // modelIds,
                env
              }: {
    runtimeConnect: RuntimeConnector,
    appName: string,
    // modelIds: ModelIds,
    env: XmtpEnv,
  }) {
    this.runtimeConnector = runtimeConnect;
    this.appName = appName;
    // this.modelIds = modelIds;
    this.env = env;
    this.signer = new RuntimeConnectorSigner(this.runtimeConnector);
  }

  async getKeys(){
    return await Client.getKeys(this.signer, {env: this.env});
  }

  async lazyInitClient(){
    if(this.xmtp == undefined) {
      console.log("create new xmtp ");
      const keys = await this.getKeys();
      this.xmtp = await Client.create(null, {
        env: this.env,
        privateKeyOverride: keys,
      })
      return this.xmtp as Client;
    }
    console.log("use old xmtp ");
    return this.xmtp as Client;
  }

  async allConversations(){
    const xmtp = await this.lazyInitClient();
    return xmtp.conversations.list();
  }


}
