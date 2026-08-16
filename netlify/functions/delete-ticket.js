/**
 * Netlify Serverless Function — POST /api/delete-ticket
 * Projeto: Godoy FreshOps AI — Exclui chamado do Neon DB
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
 */

const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const rawDbUrl = process.env.DATABASE_URL;

    if (!rawDbUrl) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Local storage delete.' })
        };
    }

    let client = null;

    try {
        const payload = JSON.parse(event.body || '{}');
        const numero = payload.numero;

        if (!numero) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Número de chamado obrigatório.' }) };
        }

        const cleanDbUrl = rawDbUrl.split('?')[0];
        client = new Client({
            connectionString: cleanDbUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        await client.query(`DELETE FROM chamados_historico WHERE numero_chamado = $1`, [numero]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Chamado excluído do Neon DB.' })
        };
    } catch (err) {
        console.error('Erro ao excluir no Neon DB:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    } finally {
        if (client) {
            await client.end().catch(() => {});
        }
    }
};
