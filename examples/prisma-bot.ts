import { PrismaClient } from '@prisma/client';
import { WhatsAppClient } from '../src/core/WhatsAppClient';
import { PrismaStorageAdapter } from '../src/storage/PrismaStorageAdapter';
import * as qrcode from 'qrcode';

async function main() {
    console.log('🚀 Iniciando validação do ambiente Prisma + Docker...');

    // 1. Inicializa o Prisma Client
    const prisma = new PrismaClient();

    try {
        // Testa conexão com banco
        await prisma.$connect();
        console.log('✅ Conexão com Banco de Dados (Docker) estabelecida!');
    } catch (error) {
        console.error('❌ Falha ao conectar no banco de dados. Verifique se o Docker está rodando.');
        console.error(error);
        process.exit(1);
    }

    // 2. Configura o Adapter
    const storage = new PrismaStorageAdapter(prisma);

    // 3. Configura o Cliente WhatsApp
    const client = new WhatsAppClient({
        sessionId: 'session-validacao-01',
        storage: storage,
        qrcode: {
            terminal: true, // Tenta usar o print nativo do Baileys
        },
        logger: undefined // Usa o padrão (pino-pretty)
    });

    // 4. Listeners de Eventos

    client.on('qr', async (qr) => {
        console.log('\n📱 QR Code recebido! Escaneie com seu WhatsApp:\n');
        // Gera QR no terminal caso o nativo falhe ou para garantir
        console.log(await qrcode.toString(qr, { type: 'terminal', small: true }));
    });

    client.on('connecting', () => {
        console.log('🔄 Conectando ao WhatsApp...');
    });

    client.on('connected', async (info) => {
        console.log(`\n🎉 Conectado!`);
        console.log(`👤 Usuário: ${info.name} (${info.phoneNumber})`);
        console.log(`💾 Sessão salva no banco de dados!`);

        // Validação extra: Consultar o banco para ver se gravou
        const sessionCount = await prisma.session.count({
            where: { sessionId: 'session-validacao-01' }
        });
        console.log(`📊 Registros de sessão no banco: ${sessionCount}`);

        if (sessionCount > 0) {
            console.log('✅ TESTE DE STORAGE: SUCESSO!');
        } else {
            console.error('❌ TESTE DE STORAGE: FALHA (Sessão não encontrada no banco)');
        }

        // Envia mensagem para si mesmo para testar (opcional)
        // await client.sendText({ to: info.phoneNumber, text: 'Teste de validação concluído!' });
    });

    client.on('disconnected', (reason) => {
        console.log('❌ Desconectado:', reason);
    });

    // 5. Inicia a conexão
    await client.connect();
}

main().catch(console.error);
