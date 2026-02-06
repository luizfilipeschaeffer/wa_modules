import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';

export async function authRoutes(fastify: FastifyInstance, options: { authController: AuthController; userController: UserController; authHook: (req: any, reply: any) => Promise<void> }) {
    const { authController, userController, authHook } = options;

    // Public Routes
    fastify.post('/auth/login', {
        schema: {
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                }
            }
        }
    }, authController.login.bind(authController));

    // Protected Routes (Users)
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', authHook);

        protectedRoutes.get('/users', {
            schema: {
                tags: ['Users'],
                security: [{ bearerAuth: [] }]
            }
        }, userController.listUsers.bind(userController));

        protectedRoutes.post('/users', {
            schema: {
                tags: ['Users'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['email', 'password', 'name'],
                    properties: {
                        email: { type: 'string' },
                        password: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' }
                    }
                }
            }
        }, userController.createUser.bind(userController));

        protectedRoutes.delete('/users/:id', {
            schema: {
                tags: ['Users'],
                security: [{ bearerAuth: [] }]
            }
        }, userController.deleteUser.bind(userController));

        // Rota para gerar token de API
        protectedRoutes.post('/auth/generate-token', {
            schema: {
                tags: ['Auth'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    properties: {
                        expiresIn: { type: 'string', description: 'Tempo de expiração (ex: 30d, 1y, 365d). Padrão: 365d' },
                        name: { type: 'string', description: 'Nome/descrição do token (ex: Financas webhook)' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            token: { type: 'string' },
                            expiresIn: { type: 'string' },
                            message: { type: 'string' },
                            user: { type: 'object' }
                        }
                    }
                }
            }
        }, authController.generateApiToken.bind(authController));
    });
}
