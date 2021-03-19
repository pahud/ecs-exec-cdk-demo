import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPatterns from '@aws-cdk/aws-ecs-patterns';
import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import * as logs from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';
import { App, CfnOutput, Construct, RemovalPolicy, Stack } from '@aws-cdk/core';

export class Demo extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const stack = Stack.of(this);
    const vpc = getOrCreateVpc(this);

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
    });

    const task = new ecs.FargateTaskDefinition(this, 'Task', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: this._createTaskExecutionRole(),
      taskRole: this._createTaskRole(),
    });
    task.addContainer('nginx', {
      //nyancat nginx
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/pahudnet/nyancat-docker-image:latest'),
      // image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../docker.d')),
      portMappings: [{ containerPort: 80 }],
    });


    // create kms key
    const kmsKey = new kms.Key(this, 'KmsKey');
    // create log group
    const logGroup = new logs.LogGroup(this, 'LogGroup');
    // ecs exec bucket
    const execBucket = new s3.Bucket(this, 'EcsExecBucket', { 
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    logGroup.grantWrite(task.taskRole);
    kmsKey.grantDecrypt(task.taskRole);
    execBucket.grantPut(task.taskRole);

    const svc = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'NginxService', {
      taskDefinition: task,
      cluster,
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
    });

    // we need ExecuteCommandConfiguration
    const cfnCluster = cluster.node.defaultChild as ecs.CfnCluster;
    cfnCluster.addPropertyOverride('Configuration.ExecuteCommandConfiguration', {
      KmsKeyId: kmsKey.keyId,
      LogConfiguration: {
        CloudWatchLogGroupName: logGroup.logGroupName,
        S3BucketName: execBucket.bucketName,
        S3KeyPrefix: 'exec-output',
      },
      Logging: 'OVERRIDE',
    });

    // enable EnableExecuteCommand for the service
    const cfnService = svc.service.node.findChild('Service') as ecs.CfnService;
    cfnService.addPropertyOverride('EnableExecuteCommand', true);

    new CfnOutput(stack, 'EcsExecCommand', {
      value:
    `ecs_exec_service ${cluster.clusterName} ${svc.service.serviceName} ${task.defaultContainer?.containerName}`,
    });
  }
  private _createTaskExecutionRole(): iam.Role {
    const role = new iam.Role(this, 'TaskExecRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
    return role;
  }
  private _createTaskRole(): iam.Role {
    const role = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    role.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        'ssmmessages:CreateControlChannel',
        'ssmmessages:CreateDataChannel',
        'ssmmessages:OpenControlChannel',
        'ssmmessages:OpenDataChannel',
      ],
      resources: ['*'],
    }));

    return role;
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

const stack = new Stack(app, 'my-stack-dev2', { env: devEnv });

new Demo(stack, 'Demo');

app.synth();

function getOrCreateVpc(scope: Construct): ec2.IVpc {
  // use an existing vpc or create a new one
  return scope.node.tryGetContext('use_default_vpc') === '1'
    || process.env.CDK_USE_DEFAULT_VPC === '1' ? ec2.Vpc.fromLookup(scope, 'Vpc', { isDefault: true }) :
    scope.node.tryGetContext('use_vpc_id') ?
      ec2.Vpc.fromLookup(scope, 'Vpc', { vpcId: scope.node.tryGetContext('use_vpc_id') }) :
      new ec2.Vpc(scope, 'Vpc', { maxAzs: 3, natGateways: 1 });
}
