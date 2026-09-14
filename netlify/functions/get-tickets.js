/**
 * Netlify Serverless Function — GET /api/get-tickets
 * Projeto: Godoy FreshOps AI — Busca chamados no Neon DB com filtro por data e fallback automatico
 */

const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
            body: JSON.stringify({
                success: true,
                source: 'local_storage',
                message: 'DATABASE_URL não configurada no Netlify.',
                tickets: []
            })
        };
    }

    let client = null;

    try {
        const cleanDbUrl = rawDbUrl.split('?')[0];
        client = new Client({
            connectionString: cleanDbUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        await client.query(`
            CREATE TABLE IF NOT EXISTS chamados_historico (
                id SERIAL PRIMARY KEY,
                data_chamado DATE NOT NULL DEFAULT CURRENT_DATE,
                numero_chamado VARCHAR(100) NOT NULL,
                problema_constatado TEXT NOT NULL,
                solucao_efetuada TEXT NOT NULL DEFAULT 'Aguardando atendimento',
                validado_por VARCHAR(255) NOT NULL DEFAULT 'Em atendimento',
                status_atendimento VARCHAR(50) NOT NULL DEFAULT 'EM_ATENDIMENTO',
                analista_nome VARCHAR(255) DEFAULT 'Caique Eduardo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const filterDate = (event.queryStringParameters && event.queryStringParameters.date) ? event.queryStringParameters.date : null;
        const analista = (event.queryStringParameters && event.queryStringParameters.analista) ? event.queryStringParameters.analista : null;

        let result;
        let queryParams = [];
        let queryStr = `
            SELECT 
                id::text,
                numero_chamado as numero,
                problema_constatado as problema,
                solucao_efetuada as solucao,
                validado_por as validacao,
                COALESCE(status_atendimento, 'EM_ATENDIMENTO') as status_atendimento,
                TO_CHAR(data_chamado, 'DD/MM/YYYY') as data,
                created_at
            FROM chamados_historico
            WHERE 1=1
        `;

        if (filterDate) {
            queryParams.push(filterDate);
            queryStr += ` AND data_chamado = $${queryParams.length}::date`;
        } else {
            // Se não informou data, busca a data de hoje para resolver o bug de cache
            queryStr += ` AND data_chamado = CURRENT_DATE`;
        }

        if (analista) {
            queryParams.push(analista);
            queryStr += ` AND analista_nome = $${queryParams.length}`;
        }

        queryStr += ` ORDER BY id DESC;`;

        result = await client.query(queryStr, queryParams);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                source: 'neon_db',
                tickets: result.rows
            })
        };
    } catch (err) {
        console.error('Erro get-tickets Neon DB:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Erro de conexão com o banco Neon' })
        };
    } finally {
        if (client) {
            await client.end().catch(() => {});
        }
    }
};
