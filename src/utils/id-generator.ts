export class IdGenerator {
  private readonly runId: number;

  constructor() {
    // The run id acts as a seed for the current test execution.
    this.runId = Date.now();
  }

  getRunId(): number {
    return this.runId;
  }

  generateSequentialId(offset: number): number {
    // Offsets make the generated ids deterministic within the same run.
    return this.runId + offset;
  }
}