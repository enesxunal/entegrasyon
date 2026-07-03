/**
 * Workflow execution queue abstraction.
 * MVP: synchronous in-process execution.
 * TODO: BullMQ / Redis worker implementation.
 */
export type QueueJob<T> = {
  id: string;
  payload: T;
};

export interface WorkflowQueue {
  enqueue<T>(job: QueueJob<T>): Promise<void>;
}

class SynchronousWorkflowQueue implements WorkflowQueue {
  private handler: ((payload: unknown) => Promise<void>) | null = null;

  setHandler(handler: (payload: unknown) => Promise<void>) {
    this.handler = handler;
  }

  async enqueue<T>(job: QueueJob<T>): Promise<void> {
    if (!this.handler) {
      throw new Error("Workflow queue handler not registered");
    }
    await this.handler(job.payload);
  }
}

export const workflowQueue = new SynchronousWorkflowQueue();
