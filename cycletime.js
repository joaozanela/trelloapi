import "dotenv/config";
import axios from "axios";
import { openDB } from "./cycletimeDB.js";
const db = openDB();

// Defina a chave da API, o token da API e o ID do quadro
const apiKey = process.env.apiKey_DB;
const apiToken = process.env.apiToken_DB;
const idBoard = process.env.idBoard_DB;
const colunaInfo = {};

// API do Trello
const trelloApi = axios.create({
  baseURL: "https://api.trello.com/1",
  params: {
    key: apiKey,
    token: apiToken,
  },
});

// Colunas do quadro
try {
  const response1 = await trelloApi.get(`/boards/${idBoard}/lists`);
  const colunasDoQuadro = response1.data;

  for (const list of colunasDoQuadro) {
    const list_id = list.id;
    const list_name = list.name;
    colunaInfo[list_id] = { totalTime: 0, numCards: 0 };

    // Ações das Colunas
    const response2 = await trelloApi.get(`/lists/${list_id}/actions`);
    const actionsDasColunas = response2.data;
    let endActionDate = null;

    for (const colunaActionData of actionsDasColunas) {
      if (colunaActionData.data !== undefined) {
        const colunaActionDate = new Date(colunaActionData.date);
        const period = colunaActionDate.toLocaleDateString();
        const colunaActionType = colunaActionData.type;
        const card_id = colunaActionData.data?.card?.id;
        const card_name = colunaActionData.data?.card?.name;

        // Calculo do Card - Ação antiga menos Ação recente
        if (
          colunaActionType === "createCard" ||
          (colunaActionType === "updateCard" && endActionDate)
        ) {
          const timeDiff = new Date(endActionDate) - new Date(colunaActionDate);
          colunaInfo[list_id].totalTime += timeDiff;
          colunaInfo[list_id].numCards++;
        }
        // Freia o Calculo - Estava calculando a entrada do Card na última coluna pela data de criação do Card
        if (
          list_id === "650b10bab4a613b8983d277e" ||
          list_name === "COLUNA_06"
        ) {
          break;
        }
        endActionDate = colunaActionDate;

        // // Calcular a média de tempo dos cards dentro de cada coluna
        const cycleTime =
          colunaInfo[list_id].totalTime / colunaInfo[list_id].numCards;
        const cycleTimeInSeconds = cycleTime / 1000;
        const cycle_time_secs = cycleTimeInSeconds.toFixed(2);

        if (colunaInfo[list_id].numCards > 0) {
          //   console.log(
          //     `Coluna: ${list_name}, Média de Tempo: ${cycle_time_secs} segundos.`
          //   );
          // Inserindo Dados no Sqlite3
          const sql1 = `INSERT INTO cards (card_id, period, card_name, list_id, cycle_time_secs) VALUES (?, ?, ?, ?, ?);`;
          db.run(sql1, [card_id, period, card_name, list_id, cycle_time_secs]);

          const sql2 = `INSERT INTO cards_avg (period, card_id, list_id, cycle_time_secs) VALUES (?, ?, ?, ?);`;
          db.run(sql2, [period, card_id, list_id, cycle_time_secs]);
        }
      }
    }
  }

  db.close((err) => {
    if (err) {
      console.error("Erro ao fechar o banco de dados:", err.message);
    } else {
      console.log("Conexão com o banco de dados encerrada com sucesso.");
    }
  });
} catch (error) {
  console.log(error);
}
