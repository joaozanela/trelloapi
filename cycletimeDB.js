import sqlite3 from "sqlite3";

let db;

export function openDB() {
  // Crie uma conexão com o banco de dados SQLite3
  const db = new sqlite3.Database("cycletimeDB.db");

  // Crie a tabela cards
  const sql1 = `CREATE TABLE IF NOT EXISTS cards (
    period DATETIME,
    card_id TEXT,
    card_name TEXT,
    list_id TEXT,
    cycle_time_secs INTEGER
  );`;
  db.exec(sql1);

  // Crie a tabela cards_avg
  const sql2 = `CREATE TABLE IF NOT EXISTS cards_avg (
    period DATETIME,
    card_id TEXT,
    list_id TEXT,
    cycle_time_secs INTEGER
  );`;
  db.exec(sql2);

  return db;
}
