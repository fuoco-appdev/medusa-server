#!/bin/bash

#Run migrations to ensure the database is updated
npx medusa db:migrate --skip-links
npx medusa db:sync-links
npx medusa build

(cd ./.medusa/server && npm install)
(cd ./.medusa/server && npm run start)