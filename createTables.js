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

const sqlCliquesAnuncios = `
CREATE TABLE IF NOT EXISTS cliques_anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id INT NOT NULL,
    clicado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (anuncio_id) REFERENCES form_anuncio(id) ON DELETE CASCADE
);`;

db.query(sqlUsuarios, err => {
    if (err) { console.error("Erro na tabela usuarios:", err); process.exit(1); }
    console.log("Tabela usuarios verificada/criada!");

    db.query(sqlFormAnuncio, err => {
        if (err) { console.error("Erro na tabela form_anuncio:", err); process.exit(1); }
        console.log("Tabela form_anuncio verificada/criada!");

        // Adiciona latitude (ignora automaticamente se a coluna já existir - erro 1060)
        db.query(`ALTER TABLE form_anuncio ADD COLUMN latitude DECIMAL(10,8) NULL;`, (err) => {
            if (err && err.errno !== 1060) console.log("Aviso latitude:", err.message);

            // Adiciona longitude (ignora automaticamente se a coluna já existir - erro 1060)
            db.query(`ALTER TABLE form_anuncio ADD COLUMN longitude DECIMAL(11,8) NULL;`, (err) => {
                if (err && err.errno !== 1060) console.log("Aviso longitude:", err.message);

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