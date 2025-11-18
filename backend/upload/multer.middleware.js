const multer = require('multer');
const path = require('path')
const storage = multer.diskStorage({
    destination : function(req,file,cb){
        cb(null,path.join(__dirname, '..', '..', 'public', 'temp'))
    },
    filename : function(req,file,cb){
       const safeName = file.originalname.replace(/\s+/g, '_'); // remove spaces
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1000);
        cb(null, `${uniqueSuffix}-${safeName}`);
    }
})

const upload = multer({storage : storage});
module.exports = upload