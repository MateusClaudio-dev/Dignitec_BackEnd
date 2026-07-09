// const mysql = require('mysql2');
// require("dotenv").config();

// const db = mysql.createConnection({
//   host: process.env.MYSQLHOST,
//   user: process.env.MYSQLUSER,
//   password: process.env.MYSQLPASSWORD,
//   database: process.env.MYSQLDATABASE,
//   port: process.env.MYSQLPORT
// });

// const sql = `
// CREATE TABLE IF NOT EXISTS form_anuncio (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     nomeProjeto VARCHAR(255),
//     categoria VARCHAR(255),
//     descricao TEXT,
//     localizacao VARCHAR(255),
//     contato VARCHAR(255),
//     imagemCapa VARCHAR(255),
//     criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );`;

// db.query(sql, err => {
//   if (err) console.log("Erro:", err);
//   else console.log("Tabela de anuncios criada!");
//   process.exit();
// });

// db.query(sqlUsuarios, err => {
//   if (err) console.log("Erro:", err);
//   else console.log("Tabela de usuarios criada!");
//   process.exit();
// });

const mysql = require('mysql2');
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT 
});

const sqlUsuarios = `
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipoConta VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
)`;
//TIMESTAMP = Tipo de dado
// DEFAULT CURRENT_TIMESTAMP = Se não for passado data na hora de salvar, usa o relogio do servidor e coloca a hora atual do momento

const sqlFormAnuncio = `
CREATE TABLE IF NOT EXISTS form_anuncio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomeProjeto VARCHAR(255),
    categoria VARCHAR(255),
    descricao TEXT,
    localizacao VARCHAR(255),
    contato VARCHAR(255),
    imagemCapa VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const sqlCliquesAnuncios = `
CREATE table IF NOT EXISTS cliques_anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id INT NOT NULL,
    clicado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (anuncio_id) REFERENCES form_anuncio(id) on DELETE CASCADE
)`;
// Chave estrangeira é (anuncio_id) referenciando-se a tabela form_anuncio e seu campo(id). 
// Deletar em cascata: se excluido anuncio da tabela form_anuncio e deleta todos os cliques

db.query(sqlUsuarios, err => {
  if (err) {
    console.error("Erro na tabela usuarios:", err);
    process.exit(1); 
    // process: obj. global que da controle sobre o processo que esta sendo rodado no terminal
    // exit(): fecha o programa. O numero é o código de status:
    // // 0 significa que o programa terminou com sucesso
    // Qualquer número diferente de zero, erro grave 

    
  } 
  console.log("Tabela usuarios criada!");

  db.query(sqlFormAnuncio, err => {
    if (err) {
      console.error("Erro na tabela form_anuncio:", err);
      process.exit(1);
    } 
    console.log("Tabela form_anuncio criada!");

    db.query(sqlCliquesAnuncios, err => {
      if (err) {
        console.error("Erro na tabela cliques_anuncios:", err)
        process.exit(1);
      }
      console.log('Tabela cliques_anuncios criada!');
      db.end(); 
    });
  });
});
