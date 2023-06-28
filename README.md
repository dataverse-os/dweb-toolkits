# External-Toolkits

This git repo is a monorepo that contains several toolkits for developers to easily integrate DataverseOS with various Web3 protocols.

## Overview

<img src="https://s3.ap-east-1.amazonaws.com/assets.s3.bucket/toolkits-overview.jpg" />

## Purpose

- Ease the development process by enabling developers to use various Web3 protocols

- All interactions and creations will be stored as files to the built-in encrypted file system in DataverseOS.

- Each protocol will define its own file format, ultimately resulting in the file system becoming a standard metadata layer for all protocols

## Project List

The project list is as follows:

| Projects  | Categories | Website                   | Status   |
| --------- | ---------- | ------------------------- | -------- |
| Tableland | Database   | https://tableland.xyz/    | Complete |
| Livepeer  | Video      | https://livepeer.org/     | Complete |
| Push      | Message    | https://staging.push.org/ | Complete |
| XMTP      | Message    | https://xmtp.org/         | Complete |
| Lens      | Social     | https://www.lens.xyz/     | Complete |
| Snapshot  | Dao        | https://snapshot.org/     | Complete |
| ...       | ...        | ...                       | ...      |

More projects will be integrated into the toolkit in the future, making it easier for developers to use.

## Setup

Install dependencies:

```sh
pnpm install
```

## Build

Build packages:

```sh
pnpm build
```

## Test

Developers can run test demo seperately which build from the corresponding package:

```sh
pnpm test:livepeer-client
```

```sh
pnpm test:push-client
```

```sh
pnpm test:tableland-client
```

However, it is important to note that before running the test demo, it should be checked whether a configuration file `.env` is required for the demo to run. If it is required, a `.env.example` file will be found in the `test` directory, and you can simply create a new `.env` file following the example shown in `.env.example` and enter your own key.

For example, the test demo for the [livepeer-client](./packages/livepeer-client/test) package requires the following environment variables to be input:

```env
VITE_APP_NAME=
VITE_MODEL_ID=
VITE_LIVEPEER_API_KEY=
```

After completing the value of environment variables, just run the demo:

```sh
pnpm test:livepeer-client
```

if successful, you can visit the demo at `http://localhost:5173/`.

An example(livepeer demo):
<img src="https://s3.ap-east-1.amazonaws.com/assets.s3.bucket/livepeer-demo.png" />

## Contributing

Contributions to this project are welcome. To contribute, please follow these steps:

1. Fork the repository and create a new branch.
2. Make your changes and test them thoroughly.
3. Submit a pull request with a detailed description of your changes.
