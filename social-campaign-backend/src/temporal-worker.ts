import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './workflows/activities';
import config from './config';
import logger from './utils/logger';

async function run() {
  try {
    // Create connection to Temporal server
    const connection = await NativeConnection.connect({
      address: config.temporal.address,
    });

    // Create worker that hosts workflow and activity implementations
    const worker = await Worker.create({
      connection,
      namespace: config.temporal.namespace,
      taskQueue: 'social-campaign-queue',
      workflowsPath: require.resolve('./workflows/campaign.workflow'),
      activities,
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 10,
    });

    logger.info('Temporal worker started', { 
      taskQueue: 'social-campaign-queue',
      namespace: config.temporal.namespace 
    });

    // Start the worker
    await worker.run();
  } catch (err) {
    logger.error('Failed to start Temporal worker', err);
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
