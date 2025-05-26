const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  verificarToken,
  verificarAdmin,
} = require("../middlewares/authMiddlewares");

router.get("/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.firstname, u.lastname, u.email, u.phone, u.gender,
        d.birthdate, d.cpf, d.address, d.vale_transporte, d.numero_trem, d.numero_onibus, d.possui_deficiencia, d.observacoes,
        json_agg(
          json_build_object('document_type', f.document_type, 'filename', f.filename, 'filepath', f.filepath)
        ) AS arquivos
      FROM users u
      LEFT JOIN user_details d ON u.id = d.user_id
      LEFT JOIN user_files f ON u.id = f.user_id
      GROUP BY u.id, d.id
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res
      .status(500)
      .json({ error: "Erro ao buscar usuários", details: err.message });
  }
});

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
      res.status(200).json({ message: "Usuário excluído com sucesso." });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Erro ao excluir usuário", details: err.message });
    }
  }
);

module.exports = router;
