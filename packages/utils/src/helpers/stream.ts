import { StreamContent } from "@dataverse/core-connector";

export class StreamHelper {
  static async traverseStreams(
    streams: any,
    streamFilter: (streamContent: StreamContent) => boolean,
    matchedHandler: (streamContent: StreamContent) => any,
    unmatchedHandler: () => any
  ) {
    for (const key in streams) {
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        if (streamFilter(streams[key].streamContent)) {
          return await matchedHandler(streams[key].streamContent);
        }
      }
    }
    unmatchedHandler();
  }
}
