// admin.js (corrigido)
const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  verificarToken,
  verificarAdmin,
} = require("../middlewares/authMiddlewares");

// Buscar todos os usuários com dados básicos
router.get("/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.firstname, u.lastname, u.picture_path, d.cpf
      FROM users u
      LEFT JOIN user_details d ON u.id = d.user_id
      ORDER BY u.id
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar lista de usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// Buscar dados completos de um único usuário (inclusive arquivos)
router.get(
  "/usuarios/:id",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    const userId = req.params.id;

    try {
      const result = await pool.query(
        `SELECT u.id, u.firstname, u.lastname, u.email, u.phone, u.gender, u.picture_path,
                d.birthdate, d.cpf, d.address, d.numero_trem, d.numero_onibus,
                d.vale_transporte, d.possui_deficiencia, d.observacoes,
                json_agg(
                  json_build_object(
                    'document_type', f.document_type,
                    'filename', f.filename,
                    'path', f.filepath,
                    'mimetype', f.mimetype
                  )
                ) AS arquivos
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
      console.error("Erro ao buscar usuário:", err);
      res.status(500).json({ error: "Erro interno", details: err.message });
    }
  }
);

router.delete(
  "/usuarios/:id",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    const userId = req.params.id;
    try {
      await pool.query("DELETE FROM user_files WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM user_details WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      res.status(200).json({ message: "Usuário excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      res.status(500).json({ error: "Erro ao excluir usuário" });
    }
  }
);

module.exports = router;
