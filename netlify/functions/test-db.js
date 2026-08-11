/**
 * Netlify Serverless Function — GET /api/test-db
 * Diagnóstico ao vivo da conexão do Neon PostgreSQL
 */

const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    const rawDbUrl = process.env.DATABASE_URL;

    if (!rawDbUrl) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'ERROR',
                message: 'DATABASE_URL não configurada nas variáveis de ambiente do Netlify.'
            })
        };
    }

    try {
        const cleanDbUrl = rawDbUrl.split('?')[0];
        const client = new Client({
            connectionString: cleanDbUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // 1. Cria tabela se não existir
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

        // 2. Insere chamado de teste de diagnóstico
        const testNum = '#DIAG-' + Math.floor(100000 + Math.random() * 900000);
        await client.query(`
            INSERT INTO chamados_historico (numero_chamado, problema_constatado, solucao_efetuada, validado_por, status_atendimento, analista_nome)
            VALUES ($1, $2, $3, $4, $5, $6);
        `, [testNum, 'Teste de conexão ao vivo do Neon DB', 'Normalizado com sucesso.', 'Teste Automático', 'CONCLUIDO', 'System']);

        // 3. Consulta total de registros
        const countRes = await client.query(`SELECT COUNT(*) FROM chamados_historico;`);
        const rowsRes = await client.query(`SELECT numero_chamado, problema_constatado, status_atendimento, TO_CHAR(data_chamado, 'DD/MM/YYYY') as data FROM chamados_historico ORDER BY id DESC LIMIT 5;`);

        await client.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'SUCCESS',
                message: '🟢 Conexão com o Neon PostgreSQL efetuada com sucesso!',
                total_chamados_no_banco: parseInt(countRes.rows[0].count, 10),
                ultimos_chamados: rowsRes.rows
            })
        };
    } catch (err) {
        console.error('Erro no teste do Neon DB:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                status: 'DB_CONNECTION_FAILED',
                error: err.message,
                detail: err.stack
            })
        };
    }
};
