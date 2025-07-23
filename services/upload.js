const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Pasta uploads na raiz do projeto
const uploadDir = path.join(__dirname, '..', 'uploads');

// Certifica que a pasta existe (cria se não existir)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração multer
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  },
  fileFilter: (req, file, cb) => {
    // Só aceitar arquivos Excel (xls, xlsx)
    if (
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'));
    }
  }
});

module.exports = upload;
