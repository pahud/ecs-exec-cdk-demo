#!/bin/bash
set -ex

function update_service(){
  awsv1 ecs update-service \
      --cluster $CLUSTER  \
      --service $SERVICE \
      --enable-execute-command \
      --force-new-deployment
}

update_service

exit 0
