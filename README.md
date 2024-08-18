# How to run the project locally

1. Setting up the project
   1. Clone the repository
   2. Install yarn in your device (if you don't have it already) [https://yarnpkg.com/getting-started/install] (Yan Installation)
   3. Run `yarn install` in the root folder of the project to install all the dependencies
2. Setting up infisical (The secrets .env)
   1. Install the CLI [https://infisical.com/docs/cli/overview] (Infisical CLI Installation)
   2. NOTE: DON'T FORGET TO UPDATE THE CLI TO THE LATEST VERSION
   3. Loggin into your account in the CLI using `infisical login` (Ask your team lead for the credentials)
   4. Run `infisical init` in the root folder of the project and select "Internal API" as the type of project
   5. After runing the init command, it will create a .infisical.json file, you need to update the `defaultEnvironment` property with `local`
3. Installing Redis Locally
      1. Windows
         1. You need to install Linux on Windows with WSL [https://learn.microsoft.com/en-us/windows/wsl/install] (WSL Installation)
         2. You need then to open the Linux terminal and initialize your own user
         3. Run `sudo apt update` to update the packages
         4. Follow these steps to install Redis [https://redis.io/docs/getting-started/installation/install-redis-on-linux/] (Redis Installation) (Use Intall on Ubuntu/Debian)
4. Running the project
   1. Open Linux terminal and run `redis-server` to start the redis server
   2. Run `yarn run watch` in the root folder of the project to start the server
