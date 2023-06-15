# External-Toolkits

This git repo is a monorepo that contains several toolkits for developers to easily integrate DataverseOS with various Web3 protocols: 
- [Tableland](https://tableland.xyz/)
- [Livepeer](https://livepeer.org/)
- [Push Protocol](https://push.org/)

## Overview
<img src="https://s2.loli.net/2023/06/15/b2dtlR7r4NyOYfe.jpg" />

## Purpose

- Ease the development process by enabling developers to use various Web3 protocols

- All interactions and creations will be stored as files to the built-in encrypted file system in DataverseOS.

- Each protocol will define its own file format, ultimately resulting in the file system becoming a standard metadata layer for all protocols

## Project List

The list of projects that have been integrated into toolkits is as follows.

| Projects  | Categories | Website                   |
| --------- | ---------- | ------------------------- |
| Tableland | Database   | https://tableland.xyz/    |
| Livepeer  | Media      | https://livepeer.org/     |
| Push      | Social     | https://staging.push.org/ |
| ...       | ...        | ...                       |

More projects will be integrated into the toolkit in the future, making it easier for developers to use.

## Setup

Install dependencies:

```sh
pnpm install
```

## Build

```sh
npx lerna run build --scope={package}
```

Note that the `--scope` option can be used to run a specific test package, which can be helpful when working with large applications. 

e.g 
```sh
npx lerna run build --scope=@dataverse/tableland-client-toolkit
```
If `--scope={package}` is not added, all packages will be compiled.
```sh
npx lerna run build
```

## Test

```sh
npx lerna run test --scope={package}
```

However, it is important to note that before running the test demo, it should be checked whether a configuration file `.env` is required for the demo to run. If it is required, a `.env.example` file will be found in the `test` directory, and you can simply create a new `.env` file following the example shown in `.env.example` and enter your own key.

For example, the test demo for the livepeer-client package requires the following environment variables to be input:

```env
VITE_APP_NAME=
VITE_MODEL_ID=
VITE_LIVEPEER_API_KEY=
```

After completing the value of environment variables, just run the demo:

```sh
npx lerna run test --scope=@dataverse/livepeer-client-toolkit
```
if successful, you can visit the demo at `http://localhost:5173/`.

An example(livepeer demo):
<img src="https://s2.loli.net/2023/06/15/Yuzl6kUf82cyitN.png" />

## Contributing

Contributions to this project are welcome. To contribute, please follow these steps:

1. Fork the repository and create a new branch.
2. Make your changes and test them thoroughly.
3. Submit a pull request with a detailed description of your changes.