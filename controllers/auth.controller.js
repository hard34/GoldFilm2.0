const { validationResult } = require("express-validator");
const AuthService = require("../services/auth.service");
const MailService = require("../services/mail.service");

class AuthController {
  errorTypes = {
    wrongPassword: "Неверный пароль. Попробуйте снова",
    incorrectEmail: "Некорректный адрес электронной почты",
    weakPassword: "Длина пароля должна составлять не менее 6 символов",
    passwordNotEntered: "Введите пароль",
    confirmationError: "Не удалось подтвердить. Попробуйте еще раз",
    wrongCode: "Неверный код",
    error: "Не удалось совершить операцию. Попробуйте еще раз",
  };
  messageTypes = {
    successRegistration: "Успешная регистрация!",
    successLogin: "Успешный вход в систему!",
    mailHasBeenSent: "На вашу почту был отправлен код подтверждения",
    successEmailConfirmation: "Вы успешно подтвердили свой email",
  };
  refreshTokenCookie = "refreshToken";

  async registration(req, res) {
    const errors = validationResult(req);
    const { email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    let user = await AuthService.createUser(
      email,
      password ? await AuthService.hashPassword(password) : null
    );

    // Генерируем и отправляем код подтверждения
    const { code, _id: tempCodeId } = await AuthService.saveTemporaryCode(email);
    await MailService.sendMail(email, code);

    res.json({
      userId: user._id,
      tempCodeId,
      message: this.messageTypes.mailHasBeenSent
      });
  }

  async login(req, res) {
    const errors = validationResult(req);
    const { email, password } = req.body;

    let user = await AuthService.getUser({ email });

    if (!user) {
      return res.json({ errors: [this.errorTypes.incorrectEmail] });
    }

    // Если у пользователя есть пароль, проверяем его
    if (user.password) {
    if (!AuthService.comparePasswords(user, password)) {
        return res.json({ errors: [this.errorTypes.wrongPassword] });
    }
    }

    // Проверяем активацию
    if (!user.isActivated) {
      return res.json({ errors: ['Почта не подтверждена. Проверьте email.'] });
    }

    const { accessToken, refreshToken } = AuthService.generateTokens({
      id: user._id,
      isAdmin: user.isAdmin,
    });

    user = await AuthService.createRefreshToken(user, refreshToken);

    res
      .cookie(this.refreshTokenCookie, refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
      })
      .json({
        user,
        message: this.messageTypes.successLogin,
        accessToken,
        refreshToken,
      });
  }

  async refresh(req, res) {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.json({ verified: false });
    }
    const verified = AuthService.verifyRefreshToken(refreshToken);
    if (!verified) {
      return res.json({ verified: false });
    }

    let user = await AuthService.getUser({ id: verified.id });

    const tokens = AuthService.generateTokens({ id: user._id, isAdmin: user.isAdmin });

    user = await AuthService.createRefreshToken(user, tokens.refreshToken);

    res
      .cookie(this.refreshTokenCookie, tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
      })
      .json({
        user,
        message: this.messageTypes.successLogin,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        verified: true,
      });
  }

  async exists(req, res) {
    const user = await AuthService.getUser({ email: req.params.value });
    res.json({ exists: !!user });
  }

  async checkConfirmation(req, res) {
    const { code, id } = req.params;
    const tempCode = await AuthService.getTemporaryCodeById(id);
    const { match } = await AuthService.checkCode(code, id);

    if (!match) return res.json({ match, errors: [this.errorTypes.wrongCode] });

    if (tempCode && tempCode.email) {
      await AuthService.activateUserByEmail(tempCode.email);
    }
    await AuthService.removeTemporaryCode(id);

    res.json({ match });
  }

  async checkPassword(req, res) {
    const errors = validationResult(req);
    const { email, password } = req.body;
    const user = await AuthService.getUser({ email });
    
    if (!user) {
      return res.json({ errors: [this.errorTypes.incorrectEmail] });
    }

    // Если у пользователя нет пароля, считаем что пароль верный
    if (!user.password) {
      return res.json({ match: true });
    }

    const match = await AuthService.comparePasswords(user, password);
    const errorsArray = errors.array();

    if (!match) {
      errorsArray.push(this.errorTypes.wrongPassword);
    }

    if (errorsArray.length) {
      return res.json({ errors: errorsArray });
    }
    res.json({ match });
  }

  async send(req, res) {
    const { email } = req.params;
    const { code, _id } = await AuthService.saveTemporaryCode();
    await MailService.sendMail(email, code);
    res.json({ message: this.messageTypes.mailHasBeenSent, id: _id });
  }

  async setAdminStatus(req, res) {
    try {
      const user = await AuthService.setAdminStatus(req.params.userId, req.body.isAdmin);
      res.json({ user });
    } catch (e) {
      console.log(e);
      res.json({ error: this.errorTypes.error });
    }
  }

  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { password } = req.body;

      // Проверяем, что пользователь меняет свой пароль
      if (req.user.id !== userId) {
        return res.json({ error: "Нет прав для изменения пароля" });
      }

      const hashedPassword = await AuthService.hashPassword(password);
      const user = await AuthService.updatePassword(userId, hashedPassword);

      res.json({ 
        message: "Пароль успешно изменен",
        user 
      });
    } catch (e) {
      console.log(e);
      res.json({ error: this.errorTypes.error });
    }
  }

  async getUserById(userId) {
    try {
      const user = await AuthService.getUser({ id: userId });
      if (!user) {
        return null;
      }
      // Не отправляем пароль и refreshToken клиенту
      const { password, refreshToken, ...userData } = user.toObject();
      return userData;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

module.exports = new AuthController();
