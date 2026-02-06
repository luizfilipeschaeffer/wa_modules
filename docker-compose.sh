#!/bin/bash
# Helper script to run docker-compose from docker/ directory

cd "$(dirname "$0")/docker" || exit 1
docker-compose "$@"
