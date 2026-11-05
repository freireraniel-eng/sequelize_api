const usuarioReqDto = require('../dtos/usuarioReqDto');
const usuarioResDto = require('../dtos/usuarioResDto');
const bcrypt = require('bcrypt');
const { Usuario } = require('../models');
const crypto = require ('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

exports.criarUsuario = async (req, res) => {
    try {
        const data = usuarioReqDto.toEntity(req.body);
        const senhaHash = await bcrypt.hash(data.senha, 12);
        data.senha = senhaHash;

        const usuario = await Usuario.create(data); // sequelize
        res.status(201).json(usuarioResDto.fromEntity(usuario));
    }
    catch (e) {
        res.status(400).json({ erro: e.message});
    }
}

exports.listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll(); //sequelize
        const resultado = usuarios.map(usuarioResDto.fromEntity);
        res.status(200).json(resultado);
    } catch (e) {
        res.status(400).json({ erro: e.message })
    }
}

exports.solicitarVerificacao = async (req, res) => {
    try {
        const {email} = req.body;
        const usuario = await Usuario.findOne({ where: {email} });  // sequelize
        if(!usuario) {
            return res.status(404).json({ erro: 'Usuario não encontrado!'});
        }
        if (usuario.emailVerificado) {
            return res.status(400).json({erro: 'Email já verificado!'});
        }
        const codigoVerificacao = crypto.randomInt(100000, 999999).toString();
        const codigoExpiracao = new Date(Date.now() + 20 * 60 * 1000);
        await usuario.update({
            codigoVerificacao,
            codigoExpiracao
        });

        const emailEnviado = await sendVerificationEmail (email, codigoVerificacao);
        if (!emailEnviado) {
            return res.status(400).json({ erro: 'Erro ao enviar verificação!'});
        }

        res.status(200).json({ message: 'Código de verificação enviado com sucesso!'});
    } catch (e) {
        res.status(400).json({ erro: e.message });

    }

}

exports.verificaremail = async (req,res) => {
    try {
        const { email, codigo } = req.body;
        const usuario = await Usuario.findOne ({ where: {email} });

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado'});
        }
        if (usuario.emailVerificado) {
            return res.status(400).json({ erro: 'Usuário já verificado!'});
        }
        if (usuario.codigoVerificacao !== codigo) {
            return res.status(401).json({ erro: 'Código inválido'});
        }
        if (new Date() > usuario.codigoExpiracao) {
            return res.status(401).json({ erro: 'Código expirado'});
        }
        await usuario.update({
            emailVerificado: true,
            codigoVerificacao: null,
            codigoExpiracao: null
        });
        res.status(200).json({ message: 'Email verificado com sucesso!'});
    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
}