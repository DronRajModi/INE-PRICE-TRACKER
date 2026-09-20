/**
 * Retry Service
 * Implements exponential backoff with jitter and attempt tracking
 */
class RetryService {
  /**
   * Executes an asynchronous task with exponential backoff retries
   * @param {Function} taskFn Function receiving attemptNumber (1-based)
   * @param {object} options
   * @returns {Promise<object>} The final task result
   */
  static async executeWithRetry(taskFn, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const baseDelayMs = options.baseDelayMs || 1500;
    const maxDelayMs = options.maxDelayMs || 8000;
    const onAttempt = options.onAttempt || (() => {});

    let lastResult = null;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await taskFn(attempt);
        lastResult = result;

        if (result && result.success) {
          await onAttempt({
            attempt,
            status: attempt > 1 ? 'RETRIED' : 'SUCCESS',
            result,
            error: null
          });
          return result;
        }

        // Result returned failure
        const isLastAttempt = attempt === maxRetries;
        const status = isLastAttempt ? 'FAILED' : 'RETRIED';

        await onAttempt({
          attempt,
          status,
          result,
          error: result?.error || 'Unknown scrape failure'
        });

        if (!isLastAttempt) {
          const delay = this.calculateBackoff(attempt, baseDelayMs, maxDelayMs);
          console.log(`[RetryService] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      } catch (err) {
        lastError = err;
        const isLastAttempt = attempt === maxRetries;
        const status = isLastAttempt ? 'FAILED' : 'RETRIED';

        await onAttempt({
          attempt,
          status,
          result: null,
          error: err.message
        });

        if (!isLastAttempt) {
          const delay = this.calculateBackoff(attempt, baseDelayMs, maxDelayMs);
          console.log(`[RetryService] Attempt ${attempt} threw error: ${err.message}. Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // If all attempts failed
    return lastResult || {
      success: false,
      price: null,
      stock: null,
      error: lastError ? lastError.message : 'All retry attempts exhausted.'
    };
  }

  /**
   * Calculates exponential backoff delay with random jitter
   */
  static calculateBackoff(attempt, baseDelayMs, maxDelayMs) {
    const exponential = baseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 500;
    return Math.min(exponential + jitter, maxDelayMs);
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RetryService;
