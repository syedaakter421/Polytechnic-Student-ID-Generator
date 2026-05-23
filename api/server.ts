// VERCEL INTEGRATION COMMENT:
// This is the Vercel Serverless Function entry point.
// It wraps and exports our main Express application from server.ts.
// You can delete the entire /api directory if you migrate to self-hosted hosting/VPS.

import app from '../server.ts';

export default app;
