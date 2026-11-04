const usuarioReqDto = require('../dtos/usuarioReqDto');
const bcrypt = require('bcrypt');
const { Usuario } = require('../models');
const usuarioResDto = require('../dtos/usuarioResDto');

exports.criarUsuario = async (req, res) => {
    try {
        const data = usuarioReqDto.toEntity(req.body);
        const senhaHash = await bcrypt.hash(data.senha, 12);
        data.senha = senhaHash;

        const usuario = await Usuario.create(data);
        res.status(201).json(usuarioResDto.fromEntity(usuario));
    }
    catch (e) {
        res.status(400).json({ erro: e.message});
    }
}