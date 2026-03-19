const router = require("express").Router();
const { registerPhone, loginPhone, deleteAccount } = require("../controllers/auth.controller");
const requireAuth = require("../middleware/requireAuth");

router.post("/register-phone", registerPhone);
router.post("/login-phone", loginPhone);
router.delete("/delete-account", requireAuth, deleteAccount);

module.exports = router;
