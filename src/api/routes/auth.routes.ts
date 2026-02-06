import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';

export async function authRoutes(fastify: FastifyInstance, options: { authController: AuthController, userController: UserController }) {
    const { authController, userController } = options;

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
        protectedRoutes.addHook('onRequest', async (request, reply) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.send(err);
            }
        });

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
    });
}
