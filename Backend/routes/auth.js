const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verificarToken } = require("../middlewares/authMiddlewares");
require("dotenv").config();

// === Upload de imagem de perfil ===
const upload = multer({ storage: multer.memoryStorage() });

router.post("/register", upload.single("picture__input"), async (req, res) => {
  try {
    const { firstname, lastname, email, password, phone, gender } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, phone, gender)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [firstname, lastname, email, hashedPassword, phone, gender]
    );

    res.status(201).json({
      message: "Usuário registrado com sucesso",
      userId: result.rows[0].id,
    });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    res
      .status(500)
      .json({ error: "Erro ao registrar usuário", details: err.message });
  }
});

// === Login com JWT ===
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const infoResult = await pool.query(
      "SELECT * FROM user_details WHERE user_id = $1",
      [user.id]
    );
    const temInfoAdicional = infoResult.rows.length > 0;

    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login bem-sucedido",
      token,
      user: {
        id: user.id,
        name: `${user.firstname} ${user.lastname}`,
        isAdmin: user.is_admin,
        hasDetails: temInfoAdicional,
      },
    });
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ error: "Erro interno", details: err.message });
  }
});

// === Informações adicionais ===
router.post("/details", async (req, res) => {
  const {
    userId,
    birthdate,
    cpf,
    address,
    valeTransporte,
    numeroTrem,
    numeroOnibus,
    possuiDeficiencia,
    observacoes,
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO user_details (
        user_id, birthdate, cpf, address,
        vale_transporte, numero_trem, numero_onibus,
        possui_deficiencia, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        birthdate,
        cpf,
        address,
        valeTransporte === "true" || valeTransporte === true,
        numeroTrem || null,
        numeroOnibus || null,
        possuiDeficiencia === "true" || possuiDeficiencia === true,
        observacoes || null,
      ]
    );

    res
      .status(201)
      .json({ message: "Informações adicionais salvas com sucesso" });
  } catch (err) {
    console.error("Erro ao salvar informações adicionais:", err);
    res
      .status(500)
      .json({ error: "Erro ao salvar informações", details: err.message });
  }
});

// === Upload múltiplo de documentos com caminhos corrigidos ===
const storageMulti = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${base}${ext}`);
  },
});
const uploadMulti = multer({ storage: storageMulti });

router.post("/upload-multiple", uploadMulti.any(), async (req, res) => {
  const userId = req.body.userId;
  const files = req.files;

  if (!userId)
    return res.status(400).json({ error: "ID do usuário não fornecido." });
  if (!files || files.length === 0)
    return res.status(400).json({ error: "Nenhum arquivo enviado." });

  try {
    for (const file of files) {
      const documentType = file.fieldname;

      // Verifica se o documento já existe
      const existing = await pool.query(
        "SELECT * FROM user_files WHERE user_id = $1 AND document_type = $2",
        [userId, documentType]
      );

      if (existing.rows.length > 0) {
        const oldFile = existing.rows[0];
        const oldFilePath = path.join(__dirname, "..", oldFile.filepath);

        // Remove arquivo do disco
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        // Remove do banco
        await pool.query("DELETE FROM user_files WHERE id = $1", [oldFile.id]);
      }

      // Salva o novo documento
      await pool.query(
        `INSERT INTO user_files (user_id, document_type, filename, filepath, mimetype)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          documentType,
          file.originalname,
          `uploads/${file.filename}`,
          file.mimetype,
        ]
      );
    }

    res.status(201).json({ message: "Arquivos enviados com sucesso!" });
  } catch (err) {
    console.error("Erro ao salvar arquivos:", err);
    res
      .status(500)
      .json({ error: "Erro ao salvar arquivos", details: err.message });
  }
});

// === Rota protegida para obter dados do usuário logado ===
router.get("/me", verificarToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, u.gender,
              d.birthdate, d.cpf, d.address, d.numero_trem, d.numero_onibus, d.vale_transporte, d.possui_deficiencia, d.observacoes,
              json_agg(json_build_object('document_type', f.document_type, 'filename', f.filename, 'path', f.filepath)) AS arquivos
         FROM users u
         LEFT JOIN user_details d ON u.id = d.user_id
         LEFT JOIN user_files f ON u.id = f.user_id
         WHERE u.id = $1
         GROUP BY u.id, d.id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar dados do usuário:", err);
    res
      .status(500)
      .json({ error: "Erro ao buscar dados", details: err.message });
  }
});

// === Excluir arquivo ===
router.delete("/files/:id", verificarToken, async (req, res) => {
  const fileId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM user_files WHERE id = $1", [
      fileId,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Arquivo não encontrado" });

    const file = result.rows[0];
    fs.unlink(path.join(__dirname, "..", file.filepath), (err) => {
      if (err) console.warn("Erro ao remover arquivo físico:", err.message);
    });

    await pool.query("DELETE FROM user_files WHERE id = $1", [fileId]);
    res.status(200).json({ message: "Arquivo excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir arquivo:", err);
    res
      .status(500)
      .json({ error: "Erro ao excluir arquivo", details: err.message });
  }
});

// === Download de arquivo ===
router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Arquivo não encontrado.");
  }

  res.download(filePath);
});

module.exports = router;
