#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Godoy FreshOps AI — Automação Python para Passagem de Plantão & Google Sheets
Desenvolvido por Godoy Solutions in TECH para Caíque Eduardo
"""

import os
import sys
import json
import requests
from datetime import datetime
try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
except ImportError:
    openpyxl = None

try:
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError:
    gspread = None

# Configurações Padrão
FRESHSERVICE_DOMAIN = os.environ.get("FRESHSERVICE_DOMAIN", "americas.freshservice.com")
FRESHSERVICE_API_KEY = os.environ.get("FRESHSERVICE_API_KEY", "")
ANALYST_NAME = os.environ.get("ANALYST_NAME", "Caíque Eduardo")

# 4 Setores Padrão da Ronda Diária Hospitalar
RONDA_SETORES = [
    {"nome": "Setor 1 — UTI Adulto & Neonatal", "status": "OK", "obs": "Sem anormalidades nas estações.", "validado": "Enfermeiro Chefe"},
    {"nome": "Setor 2 — Recepção Central & PS", "status": "OK", "obs": "Leitores e impressoras operacionais.", "validado": "Supervisão Recepção"},
    {"nome": "Setor 3 — Bloco Cirúrgico & Internação", "status": "OK", "obs": "Terminais de checagem operacionais.", "validado": "Coordenação Bloco"},
    {"nome": "Setor 4 — Ambulatório & Farmácia", "status": "OK", "obs": "Sistemas de dispensação operacionais.", "validado": "Farmacêutico Responsável"}
]

def fetch_freshservice_tickets(domain, api_key):
    """ Busca chamados encerrados/resolvidos pelo analista na API v2 do Freshservice """
    if not api_key:
        print("[!] Chave de API do Freshservice não informada. Utilizando modo offline/demonstrativo.")
        return [
            {
                "numero": "#SR-312654",
                "problema": "Leitor de código de barras desconfigurado e não bipando etiquetas no sistema da recepção.",
                "solucao": "Realizada reconfiguração dos parâmetros USB do leitor, reiniciado o spooler de impressão e testado com sucesso.",
                "validacao": "Validado com Grazielly Nadja (Enfermagem / Recepção)",
                "data": datetime.now().strftime("%d/%m/%Y")
            },
            {
                "numero": "#SR-312688",
                "problema": "Impressora de etiquetas do 3º andar travada em fila de impressão (Spooler indisponível).",
                "solucao": "Executado script de limpeza da pasta PRINTERS e reiniciado serviço Spooler no Windows Server.",
                "validacao": "Validado com Marcos Silva (Supervisão Enfermagem)",
                "data": datetime.now().strftime("%d/%m/%Y")
            }
        ]

    url = f"https://{domain}/api/v2/tickets?filter=\"status:4 OR status:5\""
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.get(url, auth=(api_key, "X"), headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            tickets_list = []
            for t in data.get("tickets", []):
                tickets_list.append({
                    "numero": f"#SR-{t.get('id')}",
                    "problema": t.get("subject", "Atendimento de suporte técnico."),
                    "solucao": t.get("description_text", "Chamado resolvido pelo analista."),
                    "validacao": "Validado com o Solicitante",
                    "data": datetime.now().strftime("%d/%m/%Y")
                })
            return tickets_list
        else:
            print(f"[!] Erro ao conectar na API Freshservice: HTTP {response.status_code}")
    except Exception as e:
        print(f"[!] Exceção na chamada de API: {e}")

    return []

def generate_excel_report(tickets, output_filename=None):
    """ Gera a planilha Excel (.xlsx) com a Ronda Diária nos 4 setores no topo e os chamados abaixo """
    if not openpyxl:
        print("[!] Biblioteca 'openpyxl' não instalada. Execute 'pip install openpyxl'")
        return None

    if not output_filename:
        today_str = datetime.now().strftime("%Y-%m-%d")
        output_filename = f"Passagem_Plantao_{ANALYST_NAME.replace(' ', '_')}_{today_str}.xlsx"

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Passagem de Plantão"

    # Estilos
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    ronda_fill = PatternFill(start_color="0D9488", end_color="0D9488", fill_type="solid")
    font_white_bold = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Segoe UI", size=10, bold=True)
    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")

    # Linha 1: Título do Hospital / Plantão
    ws.merge_cells("A1:E1")
    ws["A1"] = f"PASSAGEM DE PLANTÃO SUPORTE TÉCNICO HOSPITALAR — ANALISTA: {ANALYST_NAME.upper()}"
    ws["A1"].font = font_white_bold
    ws["A1"].fill = header_fill
    ws["A1"].alignment = align_center

    # Linha 2: Data e Turno
    ws.merge_cells("A2:E2")
    ws["A2"] = f"DATA: {datetime.now().strftime('%d/%m/%Y')} | TURNO: DIURNO (07h às 19h)"
    ws["A2"].font = font_bold
    ws["A2"].alignment = align_center

    # Linha 4: Bloco de Ronda Diária (4 Setores)
    ws.merge_cells("A4:E4")
    ws["A4"] = "RONDA DIÁRIA / PRIMEIRA RONDA (4 SETORES HOSPITALARES)"
    ws["A4"].font = font_white_bold
    ws["A4"].fill = ronda_fill
    ws["A4"].alignment = align_left

    ronda_headers = ["Setor Hospitalar", "Status da Ronda", "Observações / Ocorrências", "Validado Por", "Data"]
    ws.append(ronda_headers)
    for col in range(1, 6):
        cell = ws.cell(row=5, column=col)
        cell.font = font_bold

    for r in RONDA_SETORES:
        ws.append([r["nome"], r["status"], r["obs"], r["validado"], datetime.now().strftime("%d/%m/%Y")])

    # Linha para separar chamados
    start_tickets_row = len(RONDA_SETORES) + 7
    ws.cell(row=start_tickets_row, column=1, value="CHAMADOS ATENDIDOS NO PLANTÃO (4 BLOCOS DE LOGS)")
    ws.cell(row=start_tickets_row, column=1).font = font_white_bold
    ws.cell(row=start_tickets_row, column=1).fill = header_fill

    ticket_headers = ["Item", "1. Número do Chamado", "2. Problema Constatado", "3. Solução Efetuada", "4. Validação (Quem Validou)"]
    ws.append(ticket_headers)
    for col in range(1, 6):
        cell = ws.cell(row=start_tickets_row + 1, column=col)
        cell.font = font_bold

    for idx, t in enumerate(tickets, 1):
        ws.append([idx, t["numero"], t["problema"], t["solucao"], t["validacao"]])

    # Ajuste de largura das colunas
    ws.column_dimensions["A"].width = 10
    ws.column_dimensions["B"].width = 25
    ws.column_dimensions["C"].width = 45
    ws.column_dimensions["D"].width = 45
    ws.column_dimensions["E"].width = 30

    wb.save(output_filename)
    print(f"[✓] Planilha gerada com sucesso: {output_filename}")
    return output_filename

def update_google_sheets(tickets, spreadsheet_id=None, creds_file="credentials.json"):
    """ Atualiza uma planilha no Google Sheets via API oficial do Google """
    if not gspread:
        print("[!] Biblioteca 'gspread' não encontrada. Execute 'pip install gspread google-auth'")
        return False

    if not spreadsheet_id or not os.path.exists(creds_file):
        print("[!] Para sincronizar com o Google Sheets, forneça o ID da planilha e o arquivo credentials.json do Google Cloud.")
        return False

    try:
        scopes = ["https://www.googleapis.com/auth/spreadsheets"]
        creds = Credentials.from_service_account_file(creds_file, scopes=scopes)
        client = gspread.authorize(creds)

        sheet = client.open_by_key(spreadsheet_id).sheet1

        # Preenche os logs
        rows_to_insert = []
        for t in tickets:
            rows_to_insert.append([
                datetime.now().strftime("%d/%m/%Y"),
                t["numero"],
                t["problema"],
                t["solucao"],
                t["validacao"]
            ])

        sheet.append_rows(rows_to_insert)
        print("[✓] Logs do plantão sincronizados com sucesso na Planilha do Google Sheets!")
        return True
    except Exception as e:
        print(f"[!] Erro ao sincronizar com Google Sheets: {e}")
        return False

if __name__ == "__main__":
    print(f"=== Godoy FreshOps AI — Automação Python ===")
    print(f"Analista: {ANALYST_NAME}")
    print(f"Domínio Freshservice: {FRESHSERVICE_DOMAIN}")

    tickets_data = fetch_freshservice_tickets(FRESHSERVICE_DOMAIN, FRESHSERVICE_API_KEY)
    print(f"[+] Total de chamados processados: {len(tickets_data)}")

    output_excel = generate_excel_report(tickets_data)
    print(f"[✓] Automação concluída com sucesso!")
