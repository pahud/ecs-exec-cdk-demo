# Amazon ECS Exec with AWS CDK

[Amazon ECS exec](https://aws.amazon.com/tw/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2/) was released with CloudFormation day 1 support. Before we have AWS CDK L2 support, we can simply `addPropertyOverride` to enable this feature for our cluster and service.

This repository demonstrates how it works in action.

# Howto

```sh
$ cdk deploy -c use_default_vpc
```

Write a little helper script(i.e. `helper.sh`)

```sh
# ecs_exec_service CLUSTER SERVICE CONTAINER
function ecs_exec_service() {
  CLUSTER=$1
  SERVICE=$2
  CONTAINER=$3
  TASK=$(aws ecs list-tasks --service-name $SERVICE --cluster $CLUSTER --query 'taskArns[0]' --output text)
  ecs_exec_task $CLUSTER $TASK $CONTAINER
}

# ecs_exec_task CLUSTER TASK CONTAINER
function ecs_exec_task() {
  aws ecs execute-command  \
      --cluster $1 \
      --task $2 \
      --container $3 \
      --command "/bin/bash" \
      --interactive
}
```

Test it

```sh
source helper.sh

ecs_exec_service CLUSTER SERVICE CONTAINER
```

# In Action

See the tweets([1](https://twitter.com/pahudnet/status/1372010072809730051), and [2](https://twitter.com/pahudnet/status/1372355258513428481))

![](https://pbs.twimg.com/media/Ewpao9fUYAAhFPU?format=jpg&name=4096x4096)
![](https://pbs.twimg.com/media/EwpbHVMU8AEms9g?format=jpg&name=4096x4096)
![](https://pbs.twimg.com/media/EwuVw4IVgAU6PoJ?format=jpg&name=4096x4096)

