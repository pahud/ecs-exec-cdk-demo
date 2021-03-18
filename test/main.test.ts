import '@aws-cdk/assert/jest';
import { App, Stack } from '@aws-cdk/core';

test('Snapshot', () => {
  const app = new App();
  const stack = new Stack(app, 'test');

  expect(stack).not.toHaveResource('AWS::S3::Bucket');
});
