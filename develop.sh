#!/usr/bin/env bash

#Run migrations to ensure the database is updated
npx medusa db:migrate --skip-links

yarn build

#Start development environment
yarn start