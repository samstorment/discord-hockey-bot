# Discord Hockey Bot

## Info

* `app.js` is the main module
* We listen for discord messages in ./server/bot/bot.js
* Other bot command files are defined in ./server/bot/
* To get puppeteer to work i had to do the following to the heroku repository:
```
$ heroku buildpacks:clear
$ heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack
$ heroku buildpacks:add --index 1 heroku/nodejs
```

## Run Locally

1. Clone the repo with `$ git clone <repo-link>`

2. Download the project dependencies with `npm install`

3. This project uses a MySQL database, to set this up on Ubuntu (and probably similiar for other linux systems) do the following:
```
    $ sudo apt-get update && sudoapt-get upgrade    # update. I had to do this you might not need to
    $ sudo apt-get install mysql-server             # install the mysql server
    $ sudo service mysql start                      # start the mysql service
    $ sudo mysql -u root                            # login to the mysql terminal
```
4. To create the basic database and table used in this project do the following in the mysql terminal.
```
    > CREATE DATABASE hockey_bot;
    > CREATE TABLE keywords(
        id INT AUTO_INCREMENT NOT NULL,
        keyword VARCHAR(100),
        response TEXT,
        PRIMARY KEY(id)
    );
```

5. Create a file in the project's root directory called `.env`. That file should look like this. The `.env` contains secrets, passwords, API keys etc. so it should be add to .gitignore. It is in this project.
```
    BOT_TOKEN=<your-discord-bot-token>
    DB_HOST=<your-host>
    DB_USER=<your-user>
    DB_PASSWORD=<your-password>
    DB_DATABASE=<your-database
```

6. `npm start` will start the app with some messages about success of bot connection, db connection, etc.

## HEROKU

1. If you're using Heroku you need to set heroku config variables as well so the project works on the server. Go to your projects settings, reveal config vars, and add the following vars
```
    #KEY                    #VALUE
    BOT_TOKEN               <your-discord-bot-token>
    DB_HOST                 <your-host>
    DB_USER                 <your-user>
    DB_PASSWORD             <your-password>
    DB_DATABASE             <your-database>
```

2. Anytime we want to change our project on heroku, we must do the following on the master branch:
```
    $ git add .
    $ git commit -m "Message"
    $ git push origin master
    $ git push heroku master        # this should take a bit to setup
```

3. We can then run `$ heroku logs --tail` to view all the console.log() info in our application on heroku.