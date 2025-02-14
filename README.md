# Agent API 🚀

A lightweight deployment manager that runs on each VM instance. Built with Hono and Bun for blazing fast performance.

## What does it do?

- Handles automated deployments from GitHub
- Monitors instance health and status
- Manages process lifecycle with zero-downtime updates
- Provides real-time metrics and logging
- Self-registers with the control plane

## Quick Start

```bash
# Install dependencies
bun install

# Start the development server
bun run dev

# For production
bun run start
```

## Configuration

Create a `.env` file:

```env
CONTROL_API_URL=http://your-control-api:3000
```

## API Endpoints

### Health & System
- `GET /health` - Service health check
- `GET /system` - System information and metrics

### Instance Management
- `POST /register` - Register instance with control plane
- `GET /status` - Current instance status
- `GET /metrics` - Runtime metrics

## Development

```bash
# Run tests
bun test

# Build for production
bun run build
```

## Project Structure
```
.
├── src/
│   ├── routes/      # API routes
│   ├── utils/       # Helper functions
│   └── types/       # TypeScript types
└── app.ts          # Main application
```

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b cool-new-feature`)
3. Commit your changes (`git commit -am 'Added cool feature'`)
4. Push to the branch (`git push origin cool-new-feature`)
5. Create a Pull Request

## License

MIT - do whatever you want! 🎉 