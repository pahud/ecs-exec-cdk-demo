#!/bin/bash
set -ex

function update_cluster() {
  aws ecs update-cluster --cluster $CLUSTER \
  --configuration executeCommandConfiguration="{logging=OVERRIDE,\
  kmsKeyId=$KMS_KEY_ID,\
  logConfiguration={cloudWatchLogGroupName="$LOGGROUP",\
  s3BucketName=$ECS_EXEC_BUCKET_NAME,\
  s3KeyPrefix=exec-output}}"
}

function update_service(){
  aws ecs update-service \
      --cluster $CLUSTER  \
      --service $SERVICE \
      --enable-execute-command \
      --force-new-deployment
}

update_cluster
update_service

exit 0
