// Node/Express middleware: emit metering event for each API request
// Usage: app.use(meteringEmitter({emitFn: async (event) => { await sendToQueue(event) }}))

const { v4: uuidv4 } = require('uuid');

function meteringEmitter(opts) {
  if (!opts || typeof opts.emitFn !== 'function') throw new Error('emitFn required');

  return async function (req, res, next) {
    const start = process.hrtime.bigint();
    const request_id = uuidv4();
    res.setHeader('x-request-id', request_id);

    // Capture response finish
    res.once('finish', async () => {
      try {
        const end = process.hrtime.bigint();
        const duration_ms = Number((end - start) / BigInt(1_000_000));

        // Estimate tokens if your service has a token estimator; placeholder here
        const input_tokens = req.body && req.body.prompt ? estimateTokens(req.body.prompt) : null;
        const output_tokens = res.locals && res.locals.outputTokens ? res.locals.outputTokens : null;
        const total_tokens = (input_tokens || 0) + (output_tokens || 0) || null;

        const event = {
          event_type: 'api_call',
          timestamp: new Date().toISOString(),
          request_id,
          customer_id: req.user ? req.user.id : 'anonymous',
          account_type: req.user ? req.user.plan : 'free',
          product: 'api',
          endpoint: req.path,
          model: req.body && req.body.model ? req.body.model : null,
          model_version: req.body && req.body.model_version ? req.body.model_version : null,
          input_tokens,
          output_tokens,
          total_tokens,
          duration_ms,
          cost_estimate_usd: null, // optional: compute locally if you have model rates
          response_status: res.statusCode,
          tags: {
            agent_id: res.locals.agentId || null,
            workspace_id: req.headers['x-workspace-id'] || null
          },
          metadata: {},
          raw_event: {
            headers: filterHeaders(req.headers),
            method: req.method
          }
        };

        // fire-and-forget to emission function (eg. push to Kafka/SQS/Postgres)
        opts.emitFn(event).catch(err => {
          console.error('metering emit error', err);
        });
      } catch (err) {
        console.error('metering middleware error', err);
      }
    });

    next();
  };
}

function estimateTokens(text) {
  if (!text) return 0;
  // Simple heuristic: 1 token per 4 characters
  return Math.max(1, Math.ceil(text.length / 4));
}

function filterHeaders(headers) {
  const allowed = ['content-type','user-agent','x-forwarded-for','x-workspace-id'];
  const out = {};
  for (const k of Object.keys(headers)) {
    if (allowed.includes(k)) out[k] = headers[k];
  }
  return out;
}

module.exports = meteringEmitter;
