const { AwsCdkTypeScriptApp, DependenciesUpgradeMechanism } = require('projen');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.73.0',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'fargate-exec',
  cdkDependencies: [
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-kms',
    '@aws-cdk/aws-logs',
    '@aws-cdk/aws-s3',
  ],
  depsUpgrade: DependenciesUpgradeMechanism.githubWorkflow({
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  }),
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['pahud'],
  },
});

const common_exclude = ['cdk.out', 'cdk.context.json', 'images', 'yarn-error.log', 'dependabot.yml'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
