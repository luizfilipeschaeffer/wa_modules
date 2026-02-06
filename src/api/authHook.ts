import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * Verifica se a string parece um JWT (três partes separadas por ponto).
 */
function looksLikeJwt(token: string): boolean {
    return typeof token === 'string' && token.split('.').length === 3;
}

/**
 * Cria hook de autenticação que aceita:
 * 1) JWT (login) — validado por @fastify/jwt
 * 2) Token de API — validado pelo banco (hash do token em ApiToken)
 */
export function createAuthHook(prisma: PrismaClient) {
    return async function authHook(request: FastifyRequest, reply: FastifyReply) {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ message: 'Unauthorized', code: 'MISSING_AUTH' });
        }

        const token = authHeader.slice(7).trim();
        if (!token) {
            return reply.status(401).send({ message: 'Unauthorized', code: 'MISSING_AUTH' });
        }

        // 1) Tentar JWT
        if (looksLikeJwt(token)) {
            try {
                await request.jwtVerify();
                return;
            } catch {
                // JWT inválido ou expirado; seguir para tentar token de API
            }
        }

        // 2) Tentar token de API (hash no banco)
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const apiToken = await prisma.apiToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });

        if (!apiToken || apiToken.expiresAt < new Date()) {
            return reply.status(401).send({ message: 'Unauthorized', code: 'INVALID_OR_EXPIRED_TOKEN' });
        }

        (request as any).user = {
            id: apiToken.user.id,
            email: apiToken.user.email,
            role: apiToken.user.role,
            name: apiToken.user.name
        };
    };
}
