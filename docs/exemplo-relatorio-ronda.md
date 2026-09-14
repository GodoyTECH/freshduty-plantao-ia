# Exemplo fictício do texto copiado

O gerador preserva os cabeçalhos e marcadores do relatório aprovado. Neste exemplo, Painéis e Totens está habilitado no 2º andar, há uma pendência com localização e o validador aparece uma única vez para todo o andar:

```text
🔥 *SETORES CRÍTICOS*
🟢 *ATRIUM*
   • Status: 100% OK
   • Validado com: Equipe Atrium

🏢 *SETORES GERAIS*
*2º Andar*
   • 🟢 Máquina de Contingência: OK
   • 🟡 Posto de Enfermagem: Impressora sem conexão (Setor: UTI | Ala: Sul)
   • 🟢 Painéis e Totens: OK
   • Validado com: Fernanda Lima
```

Se o 4º andar estiver marcado como não aplicável, ele não aparece. Recolher visualmente um andar não altera a estrutura usada pelo gerador e, portanto, não o remove. Ao trocar a pendência para **OK**, a linha passa a exibir `OK`, sem os detalhes anteriores.
