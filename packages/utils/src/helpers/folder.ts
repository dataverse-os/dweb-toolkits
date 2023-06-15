import {
  MirrorFile,
  Mirrors,
  RuntimeConnector,
} from "@dataverse/runtime-connector";

export class FolderHelper {
  static async traverseFolders(
    runtimeConnector: RuntimeConnector,
    fileFilter: (file: MirrorFile) => boolean,
    matchedHandler: (file: MirrorFile) => any,
    unmatchedHandler: () => any,
  ) {
    const folders = await runtimeConnector.readFolders();
    for (const key in folders) {
      if (Object.prototype.hasOwnProperty.call(folders, key)) {
        const value = folders[key];
        return this.traverseFiles(
          value.mirrors as Mirrors,
          fileFilter,
          matchedHandler,
          unmatchedHandler
        );
      }
    }
  }

  static async traverseFiles(
    mirrors: Mirrors,
    fileFilter: (file: MirrorFile) => boolean,
    matchedHandler: (file: MirrorFile) => any,
    unmatchedHandler: () => any,
  ) {
    for (const key in mirrors) {
      if (Object.prototype.hasOwnProperty.call(mirrors, key)) {
        const file = mirrors[key].mirrorFile;
        if (fileFilter(file)) {
          return matchedHandler(file);
        }
      }
    }
    return await unmatchedHandler();
  }
}
