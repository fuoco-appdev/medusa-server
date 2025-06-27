#!/bin/bash

#Run migrations to ensure the database is updated
npx medusa db:migrate --skip-links
npx medusa links sync
npx medusa build

(cd ./.medusa/server && npm install)
(cd ./.medusa/server && npm run start)