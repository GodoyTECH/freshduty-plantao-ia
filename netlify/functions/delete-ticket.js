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

    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Local storage delete.' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const numero = payload.numero;

        if (!numero) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Número de chamado obrigatório.' }) };
        }

        const client = new Client({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        await client.query(`DELETE FROM chamados_historico WHERE numero_chamado = $1`, [numero]);

        await client.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Chamado excluído do Neon DB.' })
        };
    } catch (err) {
        console.error('Erro ao excluir no Neon DB:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
