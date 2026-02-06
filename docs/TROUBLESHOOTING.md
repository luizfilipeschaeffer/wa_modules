# Troubleshooting

## Logs de descriptografia (PreKey / "failed to decrypt")

Se aparecerem avisos como:

- `Message could not be decrypted (key/session out of sync). Sender may need to resend.`
- Ou, em versões anteriores, `PreKeyError: Invalid PreKey ID` / `No session found to decrypt message`

**O que é:** O protocolo Signal (usado pelo WhatsApp) não conseguiu descriptografar uma mensagem recebida, em geral porque as chaves da sessão estão desatualizadas em relação ao remetente.

**Quando é comum:**

- Logo após **reiniciar o servidor** e restaurar sessões (algumas mensagens em grupo podem falhar até o remetente reenviar).
- Quando um **contato ou participante de grupo** atualizou o WhatsApp e enviou com novas chaves que ainda não temos.
- Em **grupos**, mensagens de um participante cuja sessão Signal com nosso cliente ainda não foi estabelecida.

**O que fazer:**

- Nada obrigatório. O próprio WhatsApp costuma pedir ao remetente que reenvie a mensagem (retry receipt). Novas mensagens depois disso tendem a funcionar.
- Se quiser garantir que uma conversa está ok, peça ao contato **reenviar a última mensagem**.
- Esses avisos são tratados como **warn** (não error) e com log resumido para não poluir o console.

**Resumo:** É um comportamento esperado do protocolo em alguns cenários; a aplicação continua funcionando e o envio de mensagens não é afetado.
