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
        console.log('Dashboard:   http://localhost:3000/dashboard.html');
        console.log('==================================================');
        console.log('🔐 Authentication Required');
        console.log('   Login: admin@admin.com / admin');
        console.log('==================================================\n');

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
