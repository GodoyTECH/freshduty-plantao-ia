/**
 * Netlify Serverless Function — GET /api/get-tickets
 * Projeto: Godoy FreshOps AI — Busca chamados salvos no Neon DB para o app atualizar em tempo real
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
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

    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                source: 'local_storage',
                message: 'DATABASE_URL não configurada no Netlify. Usando armazenamento local.',
                tickets: []
            })
        };
    }

    try {
        const client = new Client({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // Assegura estrutura da tabela
        await client.query(`
            CREATE TABLE IF NOT EXISTS chamados_historico (
                id SERIAL PRIMARY KEY,
                data_chamado DATE NOT NULL DEFAULT CURRENT_DATE,
                numero_chamado VARCHAR(100) NOT NULL,
                problema_constatado TEXT NOT NULL,
                solucao_efetuada TEXT NOT NULL,
                validado_por VARCHAR(255) NOT NULL,
                analista_nome VARCHAR(255) DEFAULT 'Caique Eduardo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Busca chamados salvos hoje
        const result = await client.query(`
            SELECT 
                id::text,
                numero_chamado as numero,
                problema_constatado as problema,
                solucao_efetuada as solucao,
                validado_por as validacao,
                TO_CHAR(data_chamado, 'DD/MM/YYYY') as data,
                created_at
            FROM chamados_historico
            WHERE data_chamado = CURRENT_DATE
            ORDER BY id DESC;
        `);

        await client.end();

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
        console.error('Erro ao buscar chamados no Neon DB:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Erro de conexão com o banco Neon' })
        };
    }
};
