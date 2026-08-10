"""
Godoy FreshOps AI — Script de Validação de Conexão com Banco Neon PostgreSQL
Desenvolvido por Godoy Solutions in TECH para Caique Eduardo

Instruções de Uso:
1. Execute: python automation/test_neon_connection.py "SUA_DATABASE_URL_DO_NEON"
2. O script testará a conexão com a nuvem do Neon.tech e verificará se as tabelas existem!
"""

import sys
import os

def test_neon_connection(connection_string=None):
    if not connection_string:
        connection_string = os.getenv("DATABASE_URL")
    
    if not connection_string:
        print("❌ ERRO: Nenhuma Connection String do Neon fornecida!")
        print("Uso: python automation/test_neon_connection.py \"postgres://user:pass@ep-xxx.neon.tech/neondb\"")
        return False

    print("⚡ Iniciando teste de conexão segura com o Banco Neon PostgreSQL...")
    print(f"🔗 URL: {connection_string[:25]}...*** (Credenciais Ocultas por Segurança)")

    try:
        import psycopg2
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor()
        
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        print("✅ CONEXÃO COM O NEON POSTGRESQL ESTABELECIDA COM SUCESSO!")
        print(f"🐘 Versão do Banco: {db_version[0]}")

        # Testa criação da tabela de chamados se não existir
        cursor.execute("""
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
        """)
        conn.commit()
        print("📊 Tabela 'chamados_historico' verificada/criada com sucesso no Neon!")

        cursor.close()
        conn.close()
        print("✨ TUDO PRONTO E OPERACIONAL!")
        return True

    except ImportError:
        print("⚠️ A biblioteca 'psycopg2' não está instalada. Instalando temporariamente via pip...")
        os.system("pip install psycopg2-binary")
        print("Por favor, execute o comando novamente.")
        return False
    except Exception as e:
        print(f"❌ ERRO AO CONECTAR NO BANCO NEON: {e}")
        return False

if __name__ == "__main__":
    url_arg = sys.argv[1] if len(sys.argv) > 1 else None
    test_neon_connection(url_arg)
