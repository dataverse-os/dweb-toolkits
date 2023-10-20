import { FileContent } from "@dataverse/dataverse-connector/dist/esm/types/fs";

export class StreamHelper {
  static async traverseStreams(
    streams: any,
    streamFilter: (fileContent: FileContent) => boolean,
    matchedHandler: (fileContent: FileContent) => any,
    unmatchedHandler: () => any
  ) {
    for (const key in streams) {
      if (Object.prototype.hasOwnProperty.call(streams, key)) {
        if (streamFilter(streams[key].fileContent)) {
          return await matchedHandler(streams[key].fileContent);
        }
      }
    }
    unmatchedHandler();
  }
}
