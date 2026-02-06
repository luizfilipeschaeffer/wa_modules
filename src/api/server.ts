import { buildApp } from './app';

const start = async () => {
    try {
        const server = await buildApp();
        await server.ready();
        await server.listen({ port: 3000, host: '0.0.0.0' });

        console.log('\n==================================================');
        console.log('SERVER RUNNING - v1.2.0');
        console.log('==================================================');
        console.log('API Address: http://localhost:3000');
        console.log('Swagger UI:  http://localhost:3000/docs');
        console.log('==================================================\n');

        const DEFAULT_SESSION = process.env.DEFAULT_SESSION_ID || 'main-session';
        console.log(`🚀 Initializing default session: "${DEFAULT_SESSION}"...\n`);

        // Access customized decoration or logic
        if (server.hasDecorator('initDefaultSession')) {
            await (server as any).initDefaultSession(DEFAULT_SESSION);
        }

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
