// Importa os pacotes
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer'); // <--- novo 
const path = require('path');
const { error } = require('console');
require("dotenv").config();


// Cria o app Express
const app = express();
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.json());

// Habilita a pasta "uploads" para acesso público
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configura o Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // nome único
  }
});
const upload = multer({ storage }); 

// Configura a conexão com o banco de dados MySQL
// Node.js example

// conexão localHost c/ mh maquina pessoal 
//const db = mysql.createConnection({
//  host: "localhost",
//  user: "root",
//  password: "cimatec",
//  database: "dignitec",
//  port: 3306
//});

// Configura a conexão com o banco de dados MySQL usando o .env
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,       // Puxa o HOST do .env
  user: process.env.MYSQLUSER,       // Puxa o USER do .env
  password: process.env.MYSQLPASSWORD, // Puxa a SENHA do .env
  database: process.env.MYSQLDATABASE, // Puxa o NOME DO BANCO do .env
  port: process.env.MYSQLPORT || 3306  // Puxa a PORTA do .env (se não achar, usa 3306)
});

db.connect((err) => {
  if (err) console.error('Erro ao conectar ao MySQL:', err);
  else console.log('Conectado ao MySQL com sucesso!');
});

// Rota para criar conta
app.post('/criarConta', (req, res) => {
  const {nome, email, senha, confirmarSenha, tipoConta} = req.body;
  const sql = 'INSERT INTO usuarios (nome, email, senha, tipoConta) VALUES (?, ?, ?, ?)';
  const values = [nome, email, senha, tipoConta]

  db.query(sql, values, (err) => {
    if (err) {
      console.error('Erro ao inserir', err);
      res.status(500).json({message: 'Erro ao tentar criar conta'});
    } else {
      res.status(201).json({message: 'Conta criada com sucesso'});
    }
  });
})

// Rota para fazer login (entrar com a conta)
app.post('/login', (req, res) => {
  const {nameUsuario, senha} = req.body;
  const sql = 'SELECT * FROM usuarios WHERE nome = ?'

  db.query(sql, [nameUsuario], (err, results) => {
    if (err) return res.status(500).json({message: 'Erro no servidor'});
    if (results.length === 0) return res.status(401).json({message: 'E-mail ou senha incorretos'});

    const usuarioDoBanco = results[0]

    if (senha === usuarioDoBanco.senha) {
      res.status(200).json({message: 'Login realizado com sucesso'});
    } else {
      res.status(401).json({message: 'E-mail ou senha incorretos'})
    }
  });
})

// Rota de cadastro de anúncio
app.post('/anuncios', upload.single('imagemCapa'), (req, res) => {
  const { nomeProjeto, categoria, descricao, localizacao, contato, latitude, longitude} = req.body;
  const imagemCapa = req.file ? req.file.filename : null; 
  const sql = 'INSERT INTO form_anuncio (nomeProjeto, categoria, descricao, localizacao, contato, imagemCapa, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [nomeProjeto, categoria, descricao, localizacao, contato, imagemCapa, latitude, longitude];

  db.query(sql, values, (err) => {
    if (err) {
      console.error('Erro ao inserir:', err);
      res.status(500).json({ message: 'Erro ao cadastrar anúncio.' });
    } else {
      res.status(201).json({ message: 'Anúncio cadastrado com sucesso!' });
    }
  });
});

// Recebmento de cliques 
app.post('/anuncios/:id/clique', (req, res) => {
  const anuncioId = req.params.id;
  const sql = 'INSERT INTO cliques_anuncios (anuncio_id) VALUES (?)';

  db.query(sql, [anuncioId], (err, result) => {
    if (err) {
      console.error('Erro ao registrar clique')
      return res.status(500).json({message: 'Erro ao registar clique',});
    }
    return res.status(201).json({message: 'Clique computado com sucesso'})
  });
})

// Listar anúncios 
// app.get('/anuncios', (req, res) => {
// const sql = `
//     SELECT 
//       tabela_anuncios.*, 
//       COUNT(tabela_cliques.id) AS quantidadeClicks 
//     FROM form_anuncio AS tabela_anuncios 
//     LEFT JOIN cliques_anuncios AS tabela_cliques 
//       ON tabela_anuncios.id = tabela_cliques.anuncio_id 
//     GROUP BY tabela_anuncios.id
//   `;

//   // Busque todos os dados dos anúncios da tabela form_anuncio.
//   // Vá na tabela cliques_anuncios e traga os cliques correspondentes, 
//   // cruzando o ID do anúncio com o ID do anúncio gravado no clique. 
//   // Junte e organize tudo separado por anúncio e, no final, conte quantos cliques cada um teve, 
//   // jogando o resultado na propriedade quantidadeClicks.

//   db.query(sql, (err, results) => {
//     if (err) res.status(500).json({ message: 'Erro ao buscar anúncios.' });
//     else {
//       const anuncio_Com_Imagem_Tratada = results.map(anuncio => {
//         return {
//          ...anuncio, 
//          imagemURL: anuncio.imagemCapa ? `http://localhost:${port}/uploads/${anuncio.imagemCapa}` : 'assets/sem-imagem.png'
//         };
//       })
//       res.json(anuncio_Com_Imagem_Tratada);
//     }
//   });
// });

// Listar anúncios (Geral ou por Aproximação via GPS)
app.get('/anuncios', (req, res) => {
  // 1. Pegamos a latitude e longitude do visitante (se existirem na URL)
  const { lat, lng } = req.query;

  let sql = '';
  let parametrosBusca = [];

  // 2. Verificamos se o usuário passou as coordenadas para decidir qual Query usar
  if (lat && lng) {
    // SE TIVER GPS: Adicionamos o cálculo de Haversine mantendo o seu JOIN de cliques
    sql = `
      SELECT 
        tabela_anuncios.*, 
        COUNT(tabela_cliques.id) AS quantidadeClicks,
        ( 6371 * acos( cos( radians(?) ) 
          * cos( radians( tabela_anuncios.latitude ) ) 
          * cos( radians( tabela_anuncios.longitude ) - radians(?) ) 
          + sin( radians(?) ) 
          * sin( radians( tabela_anuncios.latitude ) ) ) ) AS distancia
      FROM form_anuncio AS tabela_anuncios 
      LEFT JOIN cliques_anuncios AS tabela_cliques 
        ON tabela_anuncios.id = tabela_cliques.anuncio_id 
      WHERE tabela_anuncios.latitude IS NOT NULL AND tabela_anuncios.longitude IS NOT NULL
      GROUP BY tabela_anuncios.id
      HAVING distancia <= 25 -- Filtra anúncios num raio de até 25km (pode alterar)
      ORDER BY distancia ASC; -- Ordena do mais perto para o mais longe
    `;
    // Guardamos as coordenadas na ordem exata das interrogações (?, ?, ?)
    parametrosBusca = [lat, lng, lat];
  } else {
    // SE NÃO TIVER GPS: Executa exatamente a sua query original
    sql = `
      SELECT 
        tabela_anuncios.*, 
        COUNT(tabela_cliques.id) AS quantidadeClicks 
      FROM form_anuncio AS tabela_anuncios 
      LEFT JOIN cliques_anuncios AS tabela_cliques 
        ON tabela_anuncios.id = tabela_cliques.anuncio_id 
      GROUP BY tabela_anuncios.id
    `;
  }

  // 3. Executamos a query passando os parâmetros (se o array estiver vazio, o mysql2 ignora)
  db.query(sql, parametrosBusca, (err, results) => {
    if (err) {
      console.error("Erro no banco:", err);
      return res.status(500).json({ message: 'Erro ao buscar anúncios.' });
    }
    
    // 4. Mantemos o seu mapeamento original para tratar a imagem de capa!
    const anuncio_Com_Imagem_Tratada = results.map(anuncio => {
      // Se o anúncio veio com o cálculo, arredondamos para 1 casa decimal (ex: 2.4 km)
      const distanciaFormatada = anuncio.distancia !== undefined && anuncio.distancia !== null
        ? parseFloat(anuncio.distancia.toFixed(1))
        : null;

      return {
        ...anuncio, 
        distancia: distanciaFormatada, // Adiciona a distância bonitinha no objeto
        imagemURL: anuncio.imagemCapa ? `http://localhost:${port}/uploads/${anuncio.imagemCapa}` : 'assets/sem-imagem.png'
      };
    });

    res.json(anuncio_Com_Imagem_Tratada);
  });
});

// ROTA PARA EXCLUIR ANÚNCIOS
app.delete('/anuncios/:id', (req, res) => {
  const idAnuncio = req.params.id
  const sql = 'DELETE FROM form_anuncio WHERE id = ?';

  db.query(sql, [idAnuncio], (err, result) => {
    if (err) {
      console.error('Erro ao deletar', err);
      return res.status(500).json({message: 'Erro ao excluir anúncio.'});
    }
    res.status(200).json({message: 'Anúncio removido da vitrine com sucesso'});
  });
});

// ROTA PARA EDITAR ANÚNCIOS 
app.put('/anuncios/:id', upload.single('imagemCapa'), (req, res) => {
  const idAnuncio = req.params.id;
  const { nomeProjeto, categoria, descricao, localizacao, contato } = req.body;
  
  // Se veio arquivo novo, usamos req.file.filename. Se não veio,  undefined  
  let imagemCapa = req.file ? req.file.filename : null;

  // buscar a imagem atual para não apagá-la
  if (!req.file) {
    const sqlBuscar = 'SELECT imagemCapa FROM form_anuncio WHERE id = ?';
    db.query(sqlBuscar, [idAnuncio], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: 'Erro ao localizar o anúncio.' });
      }
      
      // Recupera o nome da imagem que já estava salva
      imagemCapa = results[0].imagemCapa;
      
      // Executa o update mantendo a foto antiga
      executarUpdate(nomeProjeto, categoria, descricao, localizacao, contato, imagemCapa, idAnuncio, res);
    });
  } else {
    // Se veio imagem nova, faz o update direto com o novo arquivo
    executarUpdate(nomeProjeto, categoria, descricao, localizacao, contato, imagemCapa, idAnuncio, res);
  }
});

function executarUpdate(nomeProjeto, categoria, descricao, localizacao, contato, imagemCapa, idAnuncio, res) {
  const sql = 'UPDATE form_anuncio SET nomeProjeto = ?, categoria = ?, descricao = ?, localizacao = ?, contato = ?, imagemCapa = ? WHERE id = ?';
  const values = [nomeProjeto, categoria, descricao, localizacao, contato, imagemCapa, idAnuncio];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err, 'Erro ao tentar editar anúncio');
      return res.status(500).json({ message: 'Erro ao tentar editar anuncio' });
    }
    return res.status(200).json({ message: 'Anúncio editado com sucesso!' });
  });
}

app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));

