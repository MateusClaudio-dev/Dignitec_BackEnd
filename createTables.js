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
);`;

const sqlFormAnuncio = `
CREATE TABLE IF NOT EXISTS form_anuncio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomeProjeto VARCHAR(255),
    categoria VARCHAR(255),
    descricao TEXT,
    localizacao VARCHAR(255),
    contato VARCHAR(255),
    imagemCapa VARCHAR(255),
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

// Comandos para garantir a adição das colunas caso a tabela já exista sem elas
const sqlAlterAnuncio1 = `ALTER TABLE form_anuncio ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) NULL;`;
const sqlAlterAnuncio2 = `ALTER TABLE form_anuncio ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NULL;`;

const sqlCliquesAnuncios = `
CREATE TABLE IF NOT EXISTS cliques_anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id INT NOT NULL,
    clicado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (anuncio_id) REFERENCES form_anuncio(id) ON DELETE CASCADE
);`;

// Execução sequencial com segurança
db.query(sqlUsuarios, err => {
    if (err) { console.error("Erro na tabela usuarios:", err); process.exit(1); }
    console.log("Tabela usuarios verificada/criada!");

    db.query(sqlFormAnuncio, err => {
        if (err) { console.error("Erro na tabela form_anuncio:", err); process.exit(1); }
        console.log("Tabela form_anuncio verificada/criada!");

        // Adiciona latitude se não existir
        db.query(sqlAlterAnuncio1, () => {
            // Adiciona longitude se não existir
            db.query(sqlAlterAnuncio2, () => {
                
                db.query(sqlCliquesAnuncios, err => {
                    if (err) { console.error("Erro na tabela cliques_anuncios:", err); process.exit(1); }
                    console.log('Tabela cliques_anuncios verificada/criada!');
                    console.log('Banco de dados atualizado com sucesso!');
                    db.end(); 
                });

            });
        });
    });
});